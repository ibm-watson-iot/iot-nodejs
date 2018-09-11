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

import com.ibm.watson.developer_cloud.speech_to_text.v1.SpeechToText;
import com.ibm.watson.developer_cloud.speech_to_text.v1.model.SpeechResults;


/**
 * Recognize a sample wav file and print the transcript into the console output. Make sure you are
 * using UTF-8 to print messages; otherwise, you will see question marks.
 */
public class SpeechToTextExample {

  public static void main(String[] args) {
    SpeechToText service = new SpeechToText();
    service.setUsernameAndPassword("<username>", "<password>");

    File audio = new File("src/test/resources/speech_to_text/sample1.wav");
    SpeechResults transcript = service.recognize(audio).execute();

    System.out.println(transcript);
  }
}
