import { action } from 'mobx';
import { model, Model, modelAction, prop } from 'mobx-keystone';

/**
 * A Boolean value representing a lock, that can be locked or
 * unlocked either immediately, or after a delay.
 *
 * This class can be used, for example, to ignore overlapping
 * user interface events by locking on the first event
 * and unlocking only after other events have passed.
 */
@model('reactNativeMapboxGeometryEditor/DelayedLockModel')
export class DelayedLockModel extends Model({
  /**
   * Whether the lock is currently locked
   */
  isLocked: prop<boolean>(false),
  /**
   * Whether a delayed lock operation has been
   * scheduled.
   */
  hasDelayedLockRequest: prop<boolean>(false),
  /**
   * Whether a delayed unlock operation has been
   * scheduled.
   */
  hasDelayedUnlockRequest: prop<boolean>(false),
}) {
  /**
   * Lock immediately and cancel delayed lock or unlock operations
   */
  @modelAction
  lockNow() {
    this.hasDelayedLockRequest = false;
    this.hasDelayedUnlockRequest = false;
    this.isLocked = true;
  }

  /**
   * Unlock immediately and cancel delayed lock or unlock operations
   */
  @modelAction
  unlockNow() {
    this.hasDelayedLockRequest = false;
    this.hasDelayedUnlockRequest = false;
    this.isLocked = false;
  }

  /**
   * Lock after a delay.
   *
   * Cancels delayed unlock requests, but defers to delayed
   * lock requests that complete earlier.
   *
   * @param delay The time to wait before locking, in milliseconds
   */
  @modelAction
  lockAfterDelay(delay: number) {
    this.hasDelayedLockRequest = true;
    this.hasDelayedUnlockRequest = false;
    setTimeout(
      action('finish_lock_after_delay_wrapper', () => {
        this.finishLockAfterDelay();
      }),
      delay
    );
  }

  /**
   * End of a delayed lock operation
   */
  @modelAction
  private finishLockAfterDelay() {
    if (this.hasDelayedLockRequest) {
      this.isLocked = true;
      this.hasDelayedLockRequest = false;
    }
  }

  /**
   * Unlock after a delay.
   *
   * Cancels delayed lock requests, but defers to delayed
   * unlock requests that complete earlier.
   *
   * @param delay The time to wait before unlocking, in milliseconds
   */
  @modelAction
  unlockAfterDelay(delay: number) {
    this.hasDelayedLockRequest = false;
    this.hasDelayedUnlockRequest = true;
    setTimeout(
      action('finish_unlock_after_delay_wrapper', () => {
        this.finishUnlockAfterDelay();
      }),
      delay
    );
  }

  /**
   * End of a delayed unlock operation
   */
  @modelAction
  private finishUnlockAfterDelay() {
    if (this.hasDelayedUnlockRequest) {
      this.isLocked = false;
      this.hasDelayedUnlockRequest = false;
    }
  }
}
