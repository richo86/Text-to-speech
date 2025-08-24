import { TestBed } from '@angular/core/testing';
import { MainViewComponent } from './main-view.component';

describe('MainViewComponent', () => {
  let component: MainViewComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MainViewComponent]
    });
    const fixture = TestBed.createComponent(MainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update fileName on file selection', () => {
    const fixture = TestBed.createComponent(MainViewComponent);
    const file = new File(['"file content"'], 'test.txt', { type: 'text/plain' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const inputElement = fixture.nativeElement.querySelector('input[type="file"]');
    inputElement.files = dataTransfer.files;

    inputElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.fileName).toBe('test.txt');
  });

  it('should call onFileSelected on file input change', () => {
    const fixture = TestBed.createComponent(MainViewComponent);
    spyOn(fixture.componentInstance, 'onFileSelected');
    const inputElement = fixture.nativeElement.querySelector('input[type="file"]');
    inputElement.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.onFileSelected).toHaveBeenCalled();
  });

});
