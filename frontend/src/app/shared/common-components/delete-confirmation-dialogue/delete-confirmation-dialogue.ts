import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, output, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DeleteConfirmationModalConfig {
  title?: string;
  message?: string;
  showCloseButton?: boolean;
  showBackdrop?: boolean;
  customClass?: string;
  buttons?: DeleteConfirmationModalButton[];
}

export interface DeleteConfirmationModalButton {
  text: string;
  action?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-delete-confirmation-dialogue',
  imports: [CommonModule],
  templateUrl: './delete-confirmation-dialogue.html',
  standalone: true,
  styleUrl: './delete-confirmation-dialogue.scss'
})
export class DeleteConfirmationDialogue {

  readonly isOpen = input<boolean>(false);
  readonly config = input<DeleteConfirmationModalConfig>({});
  readonly title = input<string>('Delete Confirmation');
  readonly message = input<string>('Are you sure you want to delete this item? This action cannot be undone.');
  readonly showCloseButton = input<boolean>(true);
  readonly showBackdrop = input<boolean>(true);
  readonly customClass = input<string>('');

  readonly close = output<void>();
  readonly buttonClick = output<{ action: string; button: DeleteConfirmationModalButton }>();

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationModalConfig,
    @Optional() public dialogRef: MatDialogRef<DeleteConfirmationDialogue>
  ) {
    // If used as MatDialog, merge data with config
    if (this.data) {
      // For MatDialog usage, the config will be passed via the data parameter
      // We don't need to modify the input signals here as they are read-only
      // The template will handle the display based on the data
    }
  }

  get titleText(): string {
    return this.config().title || this.title();
  }

  get messageText(): string {
    return this.config().message || this.message();
  }

  get showClose(): boolean {
    return this.config().showCloseButton ?? this.showCloseButton();
  }

  get showBackdropValue(): boolean {
    return this.config().showBackdrop ?? this.showBackdrop();
  }

  get buttons(): DeleteConfirmationModalButton[] {
    return this.config().buttons || this.getDefaultButtons();
  }

  getButtonClasses(button: DeleteConfirmationModalButton, index: number): string {
    // Primary button (first button) - red for delete confirmation
    if (index === 0) {
      return 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500';
    }
    
    // Secondary button (second button) - gray border for cancel/close
    return 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500';
  }

  private getDefaultButtons(): DeleteConfirmationModalButton[] {
    return [
      { text: 'Delete', action: 'confirm' },
      { text: 'Cancel', action: 'cancel' }
    ];
  }

  onClose(): void {
    if (this.dialogRef) {
      // Used as MatDialog
      this.dialogRef.close(false);
    } else {
      // Used as regular component
      this.close.emit();
    }
  }

  onButtonClick(button: DeleteConfirmationModalButton): void {
    if (!button.disabled) {
      if (this.dialogRef) {
        // Used as MatDialog
        const result = button.action === 'confirm' || button.action === 'delete';
        this.dialogRef.close(result);
      } else {
        // Used as regular component
        this.buttonClick.emit({ action: button.action || 'click', button });
      }
    }
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget && this.showBackdropValue) {
      this.onClose();
    }
  }
}
