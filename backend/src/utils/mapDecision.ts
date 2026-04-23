import { FayrouzaStatus, ModerationDecision } from "../services/moderation/types";

const DECISION_TO_STATUS: Record<ModerationDecision, FayrouzaStatus> = {
  AUTO_APPROVED: 1,
  NEEDS_REVIEW: 3,
  AUTO_REJECTED: 4,
};

export function mapDecisionToStatus(decision: ModerationDecision): FayrouzaStatus {
  return DECISION_TO_STATUS[decision];
}
