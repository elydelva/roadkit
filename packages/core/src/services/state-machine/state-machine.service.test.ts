import { beforeEach, describe, expect, it } from "bun:test";
import { InvalidTransitionError } from "../../errors/errors.js";
import { StateMachineService } from "./state-machine.service.js";

describe("StateMachineService", () => {
  let sm: StateMachineService;

  beforeEach(() => {
    sm = new StateMachineService();
  });

  describe("Issue transitions", () => {
    it("allows valid transitions", () => {
      expect(sm.isValidIssueTransition("not-started", "in-progress")).toBe(true);
      expect(sm.isValidIssueTransition("not-started", "skipped")).toBe(true);
      expect(sm.isValidIssueTransition("in-progress", "completed")).toBe(true);
      expect(sm.isValidIssueTransition("in-progress", "blocked")).toBe(true);
      expect(sm.isValidIssueTransition("blocked", "in-progress")).toBe(true);
    });

    it("rejects invalid transitions", () => {
      expect(sm.isValidIssueTransition("completed", "in-progress")).toBe(false);
      expect(sm.isValidIssueTransition("skipped", "in-progress")).toBe(false);
      expect(sm.isValidIssueTransition("abandoned", "in-progress")).toBe(false);
    });

    it("throws on invalid transition via validate", () => {
      expect(() => sm.validateIssueTransition("completed", "in-progress")).toThrow(
        InvalidTransitionError
      );
    });
  });

  describe("Spec transitions", () => {
    it("allows valid transitions", () => {
      expect(sm.isValidSpecTransition("draft", "proposed")).toBe(true);
      expect(sm.isValidSpecTransition("draft", "abandoned")).toBe(true);
      expect(sm.isValidSpecTransition("proposed", "accepted")).toBe(true);
      expect(sm.isValidSpecTransition("accepted", "superseded")).toBe(true);
      expect(sm.isValidSpecTransition("accepted", "deferred")).toBe(true);
      expect(sm.isValidSpecTransition("deferred", "accepted")).toBe(true);
    });

    it("rejects invalid transitions", () => {
      expect(sm.isValidSpecTransition("draft", "accepted")).toBe(false);
      expect(sm.isValidSpecTransition("superseded", "draft")).toBe(false);
      expect(sm.isValidSpecTransition("abandoned", "draft")).toBe(false);
    });

    it("throws on invalid transition via validate", () => {
      expect(() => sm.validateSpecTransition("draft", "accepted")).toThrow(InvalidTransitionError);
    });
  });

  describe("Project transitions", () => {
    it("allows valid transitions", () => {
      expect(sm.isValidProjectTransition("planned", "active")).toBe(true);
      expect(sm.isValidProjectTransition("active", "paused")).toBe(true);
      expect(sm.isValidProjectTransition("active", "completed")).toBe(true);
      expect(sm.isValidProjectTransition("paused", "active")).toBe(true);
    });

    it("rejects invalid transitions", () => {
      expect(sm.isValidProjectTransition("planned", "completed")).toBe(false);
      expect(sm.isValidProjectTransition("completed", "active")).toBe(false);
      expect(sm.isValidProjectTransition("cancelled", "active")).toBe(false);
    });

    it("throws on invalid transition via validate", () => {
      expect(() => sm.validateProjectTransition("planned", "completed")).toThrow(
        InvalidTransitionError
      );
    });
  });

  describe("Milestone transitions", () => {
    it("allows valid transitions", () => {
      expect(sm.isValidMilestoneTransition("pending", "active")).toBe(true);
      expect(sm.isValidMilestoneTransition("active", "done")).toBe(true);
      expect(sm.isValidMilestoneTransition("active", "pending")).toBe(true);
      expect(sm.isValidMilestoneTransition("done", "active")).toBe(true);
    });

    it("rejects invalid transitions", () => {
      expect(sm.isValidMilestoneTransition("pending", "done")).toBe(false);
    });

    it("throws on invalid transition via validate", () => {
      expect(() => sm.validateMilestoneTransition("pending", "done")).toThrow(
        InvalidTransitionError
      );
    });
  });
});
