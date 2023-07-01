/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Injectable, NgZone} from '@angular/core';


/**
 * Control for speech and recording in the app
 */
@Injectable()
export class Voice {
  private voice!: any;
  private speech!: SpeechSynthesisUtterance;
  private recording?: any;
  private active!: boolean;
  isRecording: boolean = false;
  hasRecordedSound: boolean = false;
  hasProcessedRecording: boolean = false;

  constructor(private zone: NgZone) {
    // This needs to be called twice to initialize
    // TODO: listen to the event
    window.speechSynthesis.getVoices();
  }

  activate() {
    this.active = true;
  }

  deactivate(signoff?: string) {
    let isRecordingOrSpeaking =
        (window.speechSynthesis.speaking || this.recording);
    this.active = false;
    this.cancelAllInProgress();
    if (signoff && isRecordingOrSpeaking) {
      this.speakAndThen(signoff);
    }
  }

  private getVoice(name: string, lang: string) {
    let voice = null;
    let voices = window.speechSynthesis.getVoices();
    for (let i = 0; i < voices.length; i++) {
      if (voices[i].name === name && voices[i].lang === lang) {
        voice = voices[i];
      }
    }
    return voice;
  }

  initVoice() {
    this.voice = this.getVoice('Fiona', 'en') ||
        this.getVoice('English United Kingdom', 'en_GB');
  }

  cancelAllInProgress() {
    console.log('voice.cancelAllInProgress()');
    window.speechSynthesis.cancel();
    if (this.recording) {
      this.recording.abort();
      this.recording = null;
    }
  }

  // TODO: Switch next to a function
  speakAndThen(msg: string, next?: any) {
    this.initVoice();
    this.cancelAllInProgress();

    this.speech = new SpeechSynthesisUtterance(msg);
    if (this.voice) {
      this.speech.voice = this.voice;
    }
    this.speech.pitch = 1.2;
    this.speech.rate = 1;
    window.speechSynthesis.speak(this.speech);
    this.speech.onerror = () => console.log('speech.onerror');

    this.speech.onend = () => {
      console.log('speech.onend');
      if (next && this.active) {
        next();
      }
    }
  }

  // TODO: Switch processor to a function
  recordNextCommand(processor: any, waitTime?: number) {
    waitTime = waitTime || 2500;
    let windowProperties: any = window;
    var speechRecognition = windowProperties['webkitSpeechRecognition'];

    this.hasRecordedSound = false;
    this.hasProcessedRecording = false;

    this.recording = new speechRecognition();
    this.recording.interimResults = true;
    this.recording.continuous = true;
    this.recording.start();

    this.zone.run(() => this.isRecording = true);

    setTimeout(() => {
      if (this.recording && !this.hasRecordedSound) {
        this.recording.stop();
      }
    }, waitTime);

    this.recording.onresult = (event: any) => {
      console.log('recording.onresult');
      this.hasRecordedSound = true;
      if (event.results[0].isFinal) {
        console.log('recording.onresult final');
        let cmd = event.results[0][0].transcript as string;
        if (this.active) {
          processor(cmd);
          this.hasProcessedRecording = true;
        }
      }
    };

    this.recording.onend = () => {
      console.log('recording.onend');
      if (!this.hasProcessedRecording) {
        processor('');
      }
      this.zone.run(() => this.isRecording = false);
      this.recording = null;
    };

    this.recording.onerror = (err: any) => {
      console.log('recording.onerror');

      let errorResponse = err.error == 'aborted' ? 'error:aborted' : 'error';
      if (this.active) {
        processor(errorResponse);
      }
    };
  }

  // TODO: Switch processor to a function
  speakAndRecordCommand(msg: string, processor: any) {
    this.speakAndThen(
        msg, () => this.recordNextCommand((cmd: string) => processor(cmd)));
  }

  // TODO: Switch processor to a function
  speakListWithPausesForCommands(msgs: string[], processor: any) {
    if (msgs.length > 0) {
      let waitTime = (msgs.length == 1) ? 2500 : 1000;
      this.speakAndThen(msgs[0], () => this.recordNextCommand((cmd: string) => {
        // If no command, keep reading list
        if (!cmd) {
          this.speakListWithPausesForCommands(msgs.slice(1), processor);
        } else {
          processor(cmd);
        }
      }, waitTime));
    }
  }
}
