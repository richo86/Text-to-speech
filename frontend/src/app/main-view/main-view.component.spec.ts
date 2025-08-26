import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { MainViewComponent } from './main-view.component';
import { Auth } from '../auth/auth.service';

class MockAuth {
  getToken() {
    return 'test-token';
  }
  getUser() {
    return 'test-user';
  }
}

describe('MainViewComponent', () => {
  let component: MainViewComponent;
  let mediaRecorderInstance: any;

  beforeEach(() => {
    mediaRecorderInstance = {
      start: jasmine.createSpy('start'),
      stop: jasmine.createSpy('stop'),
      ondataavailable: null,
      onstop: null,
    };

    spyOn(window, 'MediaRecorder').and.returnValue(mediaRecorderInstance);
    spyOn(navigator.mediaDevices, 'getUserMedia').and.resolveTo({} as MediaStream);

    TestBed.configureTestingModule({
  imports: [MainViewComponent],
      providers: [
  { provide: Auth, useClass: MockAuth },
  { provide: HttpClient, useValue: {} }
      ]
    });
    const fixture = TestBed.createComponent(MainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update fileName and call uploadFile on file selection', () => {
    const file = new File(['"file content"'], 'test.wav', { type: 'audio/wav' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.files = dataTransfer.files;

    spyOn(component, 'uploadFile');
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: inputElement });
    component.onFileSelected(event);

    expect(component.fileName).toBe('test.wav');
    expect(component.uploadFile).toHaveBeenCalledWith(file);
  });

  it('should call onFileSelected on file input change', () => {
    const fixture = TestBed.createComponent(MainViewComponent);
    spyOn(fixture.componentInstance, 'onFileSelected');
    const inputElement = fixture.nativeElement.querySelector('input[type="file"]');
    inputElement.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.onFileSelected).toHaveBeenCalled();
  });

  it('should call startRecording when onRecord is called and not recording', () => {
    spyOn(component, 'startRecording');
    component.recording.set(false);
    component.onRecord();
    expect(component.startRecording).toHaveBeenCalled();
  });

  it('should call stopRecording when onRecord is called and recording', () => {
    spyOn(component, 'stopRecording');
    component.recording.set(true);
    component.onRecord();
    expect(component.stopRecording).toHaveBeenCalled();
  });

  it('should start media recorder when startRecording is called', async () => {
    await component.startRecording();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(mediaRecorderInstance.start).toHaveBeenCalled();
  });

  it('should stop media recorder when stopRecording is called', async () => {
    await component.startRecording();
    component.stopRecording();
    expect(mediaRecorderInstance.stop).toHaveBeenCalled();
  });

  it('should set recordedUrl and isRecordingFinished when recording is stopped', async () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost:4200/test-url');
    await component.startRecording();
    mediaRecorderInstance.onstop();
    expect(component.isRecordingFinished()).toBe(true);
    expect(component.recordedUrl()).not.toBeNull();
  });

  it('should call uploadFile and onDiscard when onUpload is called', () => {
    spyOn(component, 'uploadFile');
    spyOn(component, 'onDiscard');
    component['recordedBlob'] = new Blob();
    component.onUpload();
    expect(component.uploadFile).toHaveBeenCalled();
    expect(component.onDiscard).toHaveBeenCalled();
  });

  it('should reset signals and properties on onDiscard', () => {
    component.recordedUrl.set('test-url' as any);
    component.isRecordingFinished.set(true);
    component['recordedBlob'] = new Blob();
    component.fileName = 'test.wav';

    component.onDiscard();

    expect(component.recordedUrl()).toBeNull();
    expect(component.isRecordingFinished()).toBe(false);
    expect(component['recordedBlob']).toBeNull();
    expect(component.fileName).toBeNull();
  });

});
