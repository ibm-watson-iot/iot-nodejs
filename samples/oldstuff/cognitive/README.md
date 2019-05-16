# Watson Cognitive Samples


## Introduction
IBM Watson has a set of niche services, made available on Bluemix, to ensure the above mentioned scenario is carried out in a much smoother way. Watson Speech To Text, Language Translation, Text To Speech and Watson IoT Platform are the Bluemix services, whose capabilities are leveraged in this recipe, to demonstrate how the voice spoken in one language gets translated to another language, as the audio is streamed continuously.

Read more: http://linkis.com/developer.ibm.com/re/R8u3T


## Command Transmission
Utilises the the Watson Speech to Text(STT) service to convert the voice to text, allowing you to issue a command to a device via simple mapping.


## Echo Translation
The Echo translation sample can be broadly classified into Device side execution and execution on Bluemix platform.

### Execution on Device:
Echo Translation Sample makes use of the Mic connected to the Raspberry Pi Device as the source of audio, in the preferred language of the user. The Raspberry Pi Device hosts the Echo Translation sample code, which comprises code snippets to execute & perform both Speech To Text (STT) and Text To Speech (TTS) on the Device itself. The output audio stream from the Text To Speech service can be written directly to a file on Device file system in one of the supported audio formats.

### Execution on Bluemix Platform:
The Bluemix platform hosts the set of Watson services that are part of the Echo Translation Sample. Speech To Text (STT) service, Watson Language Translation (LT) service, Text To Speech (TTS) service and the Watson IoT Platform (WIoTP) are all hosted on Bluemix. The sample code on the Device makes use of the Authentication Credentials of STT & TTS to execute respective code snippets. The Watson Language Translation service plays the role of the vital cog, as it translates the incoming data from choice of source language to the preferred target language. The WIoTP plays a significant role, as it proves to be the communication bridge between the set of Watson services that are being used in the Echo Translation model.
