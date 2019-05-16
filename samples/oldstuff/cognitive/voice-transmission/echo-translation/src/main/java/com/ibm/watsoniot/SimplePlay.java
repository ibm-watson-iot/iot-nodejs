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
 
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.DataLine;
import javax.sound.sampled.LineUnavailableException;
import javax.sound.sampled.SourceDataLine;
import javax.sound.sampled.UnsupportedAudioFileException;
 
/**
 * This is an example program that demonstrates how to play back an audio file
 * using the SourceDataLine in Java Sound API.
 *
 */
public class SimplePlay {
    
	private static int BUFFER_SIZE = 4096;
    /**
     * Play a given audio file.
     * @param audioFilePath Path of the audio file.
     * @throws IOException 
     */
    public void play(InputStream in) throws IOException {
        try {
            AudioInputStream audioStream = AudioSystem.getAudioInputStream(in);
 
            AudioFormat format = audioStream.getFormat();
            
            DataLine.Info info = new DataLine.Info(SourceDataLine.class, format);
            
            SourceDataLine audioLine = (SourceDataLine) AudioSystem.getLine(info);
 
            audioLine.open(format);
 
            audioLine.start();
             
            System.out.println("Playback started.");
             
            byte[] bytesBuffer = new byte[BUFFER_SIZE];
            int bytesRead = -1;
 
            System.out.println(audioStream.available());
            while ((bytesRead = audioStream.read(bytesBuffer)) != -1) {
                audioLine.write(bytesBuffer, 0, bytesRead);
            }
             
            audioLine.drain();
            audioLine.close();
            audioStream.close();
             
            System.out.println("Playback completed.");
             
        } catch (UnsupportedAudioFileException ex) {
            System.out.println("The specified audio file is not supported.");
            ex.printStackTrace();
        } catch (LineUnavailableException ex) {
            System.out.println("Audio line for playing back is unavailable.");
            ex.printStackTrace();
        } catch (IOException ex) {
            System.out.println("Error playing the audio file.");
            ex.printStackTrace();
        }      
    }
}
