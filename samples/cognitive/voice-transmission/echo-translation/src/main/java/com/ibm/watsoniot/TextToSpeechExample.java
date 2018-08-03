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
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.util.List;
import java.util.Properties;

import com.ibm.watson.developer_cloud.text_to_speech.v1.TextToSpeech;
import com.ibm.watson.developer_cloud.text_to_speech.v1.model.AudioFormat;
import com.ibm.watson.developer_cloud.text_to_speech.v1.model.CustomTranslation;
import com.ibm.watson.developer_cloud.text_to_speech.v1.model.CustomVoiceModel;
import com.ibm.watson.developer_cloud.text_to_speech.v1.model.Voice;
import com.ibm.watson.developer_cloud.text_to_speech.v1.util.WaveUtils;

public class TextToSpeechExample {
	
	private final static String PROPERTIES_FILE_NAME = "/device.properties";
	
	public InputStream getSpeech(String text) throws IOException {
		
		/**
		 * Load device properties file
		 */
		Properties props = new Properties();
		try {
			props.load(TextToSpeechExample.class.getResourceAsStream(PROPERTIES_FILE_NAME));
		} catch (IOException e1) {
			System.err.println("Not able to read the properties file, exiting..");
			System.exit(-1);
		}
		
		/**
		 * Read individual parameter values from device properties file
		 */
			
		String tts_username = trimedValue(props.getProperty("tts-username"));
		String tts_password = trimedValue(props.getProperty("tts-password"));
		
	    //TextToSpeech service = new TextToSpeech("3b0f5473-fd6b-42fe-a93e-549e63b0aadb", "40XogEeBSm5f");
	    TextToSpeech service = new TextToSpeech(tts_username, tts_password);
	
	    //synthesize with custom voice model
	    InputStream in = service.synthesize(text, Voice.ES_LAURA, AudioFormat.WAV).execute();
	    return WaveUtils.reWriteWaveHeader(in);
	    //writeToFile(WaveUtils.reWriteWaveHeader(in), new File("c:\\output.wav"));
	}

	private static void writeToFile(InputStream in, File file) {
		try {
			OutputStream out = new FileOutputStream(file);
			byte[] buf = new byte[1024];
			int len;
			while ((len = in.read(buf)) > 0) {
				out.write(buf, 0, len);
			}
			out.close();
			in.close();
	    } catch (Exception e) {
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
}
