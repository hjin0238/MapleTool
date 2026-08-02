import { POTENTIAL_GRADE } from "../../../../constants/enhance/potential";
import PotentialCondition from "./potentialCondition";

export default interface PotentialConditionSet {
  conditions: PotentialCondition[];
  targetGrade?: POTENTIAL_GRADE;
}
