import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../auth/auth.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css']
})
export class MainViewComponent {
  minRecordingDuration = 10;
  recordStartDelay = 500;
  fileName: string | null = null;
  isAudioAvailable = false;
  recording = signal(false);
  isDelaying = signal(false);
  recordingStartTime = signal<Date | null>(null);
  isStopDisabled = signal(false);
  recordedUrl = signal<SafeUrl | null>(null);
  isRecordingFinished = signal(false);
  textToSpeechControl = new FormControl('');
  synthesizedAudioUrl = signal<SafeUrl | null>(null);
  isSynthesizing = signal(false);
  synthesizeError = signal<string | null>(null);
  uploadError = signal<string | null>(null);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private mediaRecorder: MediaRecorder | null = null;
  private recordedBlob: Blob | null = null;

  constructor(private readonly cdRef: ChangeDetectorRef) {}

  onFileSelected(event: Event): void {
    this.uploadError.set(null);
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedTypes = ['audio/wav', 'audio/mpeg'];
      if (allowedTypes.includes(file.type)) {
        this.fileName = file.name;
        this.uploadFile(file);
      } else {
        this.uploadError.set('Invalid file type. Please upload a WAV or MP3 file.');
      }
    }
  }

  uploadFile(file: File): void {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.http.post('http://localhost:8000/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: () => {
        console.log('File uploaded successfully');
        this.isAudioAvailable = true;
      },
      error: (error) => {
        console.error('Error uploading file', error);
        this.uploadError.set(error?.error?.detail || 'An error occurred while uploading the file.');
      }
    });
  }

  onRecord(): void {
    if (this.recording()) {
      this.isStopDisabled.set(false);
      this.stopRecording();
    } else {
      this.isStopDisabled.set(true);
      this.startRecording();
      this.isDelaying.set(true);
    }
  }

  startRecording(): void {
    this.uploadError.set(null);
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();
        this.recordingStartTime.set(new Date());
        setTimeout(() => {
          this.recording.set(true);
          this.isDelaying.set(false);
        }, this.recordStartDelay);

        const audioChunks: Blob[] = [];
        this.mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = async () => {
          const recordedBlob = new Blob(audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          const wavBlob = await this.encodeToWav(recordedBlob);
          this.recordedBlob = wavBlob;
          const url = URL.createObjectURL(this.recordedBlob);
          this.recordedUrl.set(this.sanitizer.bypassSecurityTrustUrl(url));
          this.isRecordingFinished.set(true);
          this.fileName = this.authService.getUser() + '.wav';
          this.cdRef.detectChanges();
        };

        setTimeout(() => {
          this.isStopDisabled.set(false);
        }, this.minRecordingDuration*1000);
      })
      .catch(err => {
        console.error('Error getting user media', err);
        this.uploadError.set('Could not access microphone. Please check permissions.');
      });
  }

  stopRecording(): void {
    if (this.mediaRecorder && !this.isStopDisabled()) {
      this.isAudioAvailable = false;
      this.mediaRecorder.stop();
      this.recording.set(false);
      this.isRecordingFinished.set(true);
    }
  }

  onUpload(): void {
    if (this.recordedBlob) {
      this.uploadFile(new File([this.recordedBlob], this.fileName!));
      this.onDiscard();
    }
  }

  onDiscard(): void {
    this.recordedBlob = null;
    this.recordedUrl.set(null);
    this.isRecordingFinished.set(false);
    this.fileName = null;
  }

  onSynthesize(): void {
    const text = this.textToSpeechControl.value;
    if (!text) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.isSynthesizing.set(true);
    this.synthesizedAudioUrl.set(null);
    this.synthesizeError.set(null);

    this.http.post('http://localhost:8000/synthesize', { text }, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.synthesizedAudioUrl.set(this.sanitizer.bypassSecurityTrustUrl(url));
        this.isSynthesizing.set(false);
      },
      error: async (error) => {
        console.error('Error synthesizing speech', error);
        const errorText = await this.parseErrorBlob(error.error);
        this.synthesizeError.set(errorText || 'An error occurred while synthesizing speech.');
        this.isSynthesizing.set(false);
      }
    });
  }

  private parseErrorBlob(blob: Blob): Promise<string | null> {
    return new Promise((resolve) => {
      if (blob.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const result = JSON.parse(reader.result as string);
            resolve(result.detail || null);
          } catch (e) {
            resolve(null);
          }
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsText(blob);
      } else {
        resolve(null);
      }
    });
  }

  private async encodeToWav(blob: Blob): Promise<Blob> {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return this.createWavBlob(audioBuffer);
  }

  private createWavBlob(audioBuffer: AudioBuffer): Blob {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    this.setUint32(view, pos, 0x46464952); // "RIFF"
    pos += 4;
    this.setUint32(view, pos, length - 8); // file length - 8
    pos += 4;
    this.setUint32(view, pos, 0x45564157); // "WAVE"
    pos += 4;
    this.setUint32(view, pos, 0x20746d66); // "fmt " chunk
    pos += 4;
    this.setUint32(view, pos, 16); // length of format data
    pos += 4;
    this.setUint16(view, pos, 1); // format type 1 (PCM)
    pos += 2;
    this.setUint16(view, pos, numOfChan);
    pos += 2;
    this.setUint32(view, pos, audioBuffer.sampleRate);
    pos += 4;
    this.setUint32(view, pos, audioBuffer.sampleRate * 2 * numOfChan); // byte rate
    pos += 4;
    this.setUint16(view, pos, numOfChan * 2); // block align
    pos += 2;
    this.setUint16(view, pos, 16); // bits per sample
    pos += 2;
    this.setUint32(view, pos, 0x61746164); // "data" chunk
    pos += 4;
    this.setUint32(view, pos, length - pos - 4); // data length
    pos += 4;

    // write interleaved PCM data
    for (i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    offset = 0;
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private setUint16(view: DataView, offset: number, value: number) {
    view.setUint16(offset, value, true);
  }

  private setUint32(view: DataView, offset: number, value: number): void {
    view.setUint32(offset, value, true);
  }
}
