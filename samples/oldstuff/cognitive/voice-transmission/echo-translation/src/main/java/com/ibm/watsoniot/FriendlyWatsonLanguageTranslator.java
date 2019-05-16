/**
 * 
 *****************************************************************************
 Copyright (c) 2016 IBM Corporation and other Contributors.
 All rights reserved. This program and the accompanying materials are made available under the terms of the Eclipse Public License v1.0
 which accompanies this distribution, and is available at http://www.eclipse.org/legal/epl-v10.html
 Contributors:
 Sathiskumar Palaniappan - Initial Contribution
 Prasanna Alur Mathada - Initial Contribution
 *****************************************************************************
 *
 */
package com.ibm.watsoniot;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.DataLine;
import javax.sound.sampled.LineUnavailableException;
import javax.sound.sampled.TargetDataLine;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import com.ibm.iotf.client.device.Command;
import com.ibm.iotf.client.device.CommandCallback;
import com.ibm.iotf.client.device.DeviceClient;
//import com.ibm.iotf.sample.devicemgmt.device.DeviceInitiatedHandlerSample;
import com.ibm.watson.developer_cloud.http.HttpMediaType;
import com.ibm.watson.developer_cloud.speech_to_text.v1.SpeechToText;
import com.ibm.watson.developer_cloud.speech_to_text.v1.model.RecognizeOptions;
import com.ibm.watson.developer_cloud.speech_to_text.v1.model.SpeechAlternative;
import com.ibm.watson.developer_cloud.speech_to_text.v1.model.SpeechResults;
import com.ibm.watson.developer_cloud.speech_to_text.v1.model.Transcript;
import com.ibm.watson.developer_cloud.speech_to_text.v1.websocket.BaseRecognizeCallback;

/**
 * Recognize microphone input speech continuously using WebSockets.
 */
public class FriendlyWatsonLanguageTranslator {
	
	private final static String PROPERTIES_FILE_NAME = "/device.properties";
	
	private DeviceClient myClient;
	
	private void createDevice() {
		/**
	     * Load device properties
	     */
		Properties props = new Properties();
		try {
			props.load(FriendlyWatsonLanguageTranslator.class.getResourceAsStream(PROPERTIES_FILE_NAME));
		} catch (IOException e1) {
			System.err.println("Not able to read the properties file, exiting..");
			System.exit(-1);
		}
		
		//Instantiate and connect to IBM Watson IoT Platform
		
		try {
			myClient = new DeviceClient(props);
			myClient.connect();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	/**
	 * Method that helps trim the output of the Device Properties File
	 * @param value
	 * @return
	 */
	private static String trimedValue(String value) {
		if(value == null || value == "") {
			return "";
		} else {
			return value.trim();
		}
	}
	
	private void setCallback() {
		MyNewCommandCallback callback = new MyNewCommandCallback();
		Thread t = new Thread(callback);
		t.start();
		myClient.setCommandCallback(callback);
	}
	
	public static void main(String[] args) throws Exception {
		FriendlyWatsonLanguageTranslator lt = new FriendlyWatsonLanguageTranslator();
		lt.createDevice();
		lt.setCallback();
		lt.streamVoice();
		Thread.sleep(1000 * 300);
		
	}
	
	private void streamVoice() throws LineUnavailableException {
		
		/**
		 * Load device properties file
		 */
		Properties props = new Properties();
		try {
			props.load(FriendlyWatsonLanguageTranslator.class.getResourceAsStream(PROPERTIES_FILE_NAME));
		} catch (IOException e1) {
			System.err.println("Not able to read the properties file, exiting..");
			System.exit(-1);
		}
		
		/**
		 * Read individual parameter values from device properties file
		 */
			
		String stt_username = trimedValue(props.getProperty("stt-username"));
		String stt_password = trimedValue(props.getProperty("stt-password"));
		
	    SpeechToText service = new SpeechToText();
	    //service.setUsernameAndPassword("ad9a0843-c7df-455e-a6fd-d2d45b39089e", "o3KwnOJos8wV");
	    service.setUsernameAndPassword(stt_username, stt_password);
	
	    // Signed PCM AudioFormat with 16kHz, 16 bit sample size, mono
	    int sampleRate = 16000;
	    AudioFormat format = new AudioFormat(sampleRate, 16, 1, true, false);
	    DataLine.Info info = new DataLine.Info(TargetDataLine.class, format);
	
	    if (!AudioSystem.isLineSupported(info)) {
	      System.out.println("Line not supported");
	      System.exit(0);
	    }
	
	    TargetDataLine line = (TargetDataLine) AudioSystem.getLine(info);
	    line.open(format);
	    line.start();
	
	    AudioInputStream audio = new AudioInputStream(line);
	
	    RecognizeOptions options = new RecognizeOptions.Builder()
	      .continuous(true)
	      .interimResults(true)
	      .timestamps(true)
	      .wordConfidence(true)
	      //.inactivityTimeout(5) // use this to stop listening when the speaker pauses, i.e. for 5s
	      .contentType(HttpMediaType.AUDIO_RAW + "; rate=" + sampleRate)
	      .build();
	
	    service.recognizeUsingWebSocket(audio, options, new BaseRecognizeCallback() {
	      @Override
	      public void onTranscription(SpeechResults speechResults) {
	    	  List<Transcript> transcripts = speechResults.getResults();
	    	  for(int i = 0; i < transcripts.size(); i++) {
	    		  Transcript transcript = transcripts.get(i);
	    		  if(transcript.isFinal()) {
	    			  List<SpeechAlternative> alternatives = transcript.getAlternatives();
	    			  for(int j = 0; j < alternatives.size(); j++) {
	    				  System.out.print("publishing tanscript: "+ alternatives.get(j).getTranscript());
	    				  //Generate a JSON object of the event to be published
	    				  JsonObject event = new JsonObject();
	    				  event.addProperty("speech", alternatives.get(j).getTranscript());
	    				  boolean status = myClient.publishEvent("transcript", event);
	    				  System.out.println(": "+status);
	    			  }
	    		  }
	    	  }
	      }
	    });
	
/*	    System.out.println("Listening to your voice for the next 30s...");
	    Thread.sleep(300 * 1000);
	
	    // closing the WebSockets underlying InputStream will close the WebSocket itself.
	    line.stop();
	    line.close();
	
	    System.out.println("Fin.");*/
	}
	
	//Implement the CommandCallback class to provide the way in which you want the command to be handled
	private static class MyNewCommandCallback implements CommandCallback, Runnable {
		final static JsonParser JSON_PARSER = new JsonParser();
		// A queue to hold & process the commands for smooth handling of MQTT messages
		private BlockingQueue<Command> queue = new LinkedBlockingQueue<Command>();
		private SimplePlay simplePlay = new SimplePlay();
		private TextToSpeechExample ts = new TextToSpeechExample();
		/**
		 * This method is invoked by the library whenever there is command matching the subscription criteria
		 */
		public void processCommand(Command cmd) {
			try {
				queue.put(cmd);
				} catch (InterruptedException e) {
			}			
		}

		public void run() {
			while(true) {
				Command cmd = null;
				try {
					//In this sample, we just display the command
					cmd = queue.take();
					if(cmd.getPayload() == null) {
						continue;
					}
					/*System.out.println("COMMAND RECEIVED = " + cmd);
					System.out.println("COMMAND getPayload = " + cmd.getPayload());*/
					
					try {
						
						JsonObject payloadJson = JSON_PARSER.parse(cmd.getPayload()).getAsJsonObject();
						if (payloadJson.has("d")) {
							payloadJson = payloadJson.get("d").getAsJsonObject();
						}
						String text = payloadJson.get("content").getAsString();
						InputStream in = ts.getSpeech(text);
						simplePlay.play(in);
					} catch (Exception e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
				} catch (InterruptedException e) {}
			}
		}
	}

}
