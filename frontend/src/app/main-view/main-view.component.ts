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
    MatProgressSpinnerModule
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
  private readonly http = inject(HttpClient);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private mediaRecorder: MediaRecorder | null = null;
  private recordedBlob: Blob | null = null;

  constructor(private readonly cdRef: ChangeDetectorRef) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedTypes = ['audio/wav', 'audio/mpeg'];
      if (allowedTypes.includes(file.type)) {
        this.fileName = file.name;
        this.uploadFile(file);
      } else {
        console.error('Invalid file type. Please upload a WAV or MP3 file.');
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

        this.mediaRecorder.onstop = () => {
          this.recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const url = URL.createObjectURL(this.recordedBlob);
          this.recordedUrl.set(this.sanitizer.bypassSecurityTrustUrl(url));
          this.isRecordingFinished.set(true);
          this.fileName = this.authService.getUser() + '.wav';
          this.cdRef.detectChanges();
          console.log("recording has been stopped");
        };

        setTimeout(() => {
          this.isStopDisabled.set(false);
        }, this.minRecordingDuration*1000);
      })
      .catch(err => {
        console.error('Error getting user media', err);
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
}
