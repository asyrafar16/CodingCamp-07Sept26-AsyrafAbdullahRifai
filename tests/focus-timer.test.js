// Tests for FocusTimer
// Property test in task 5.2, unit tests in task 5.5

describe('FocusTimer', () => {
  describe('formatTimer', () => {
    it.todo('Property 4: Timer display is always valid MM:SS');
  });

  describe('state machine', () => {
    it.todo('Stopped -> Running on start()');
    it.todo('Running -> Paused on stop()');
    it.todo('Paused -> Running on start()');
    it.todo('Running -> Ended at 00:00');
    it.todo('Ended -> Stopped on reset()');
    it.todo('start() while already running is a no-op');
    it.todo('reset() from Running restores 25:00');
    it.todo('reset() from Paused restores 25:00');
    it.todo('reset() from Ended restores 25:00 and removes end indicator');
    it.todo('end-of-session indicator appears at 00:00');
  });
});
