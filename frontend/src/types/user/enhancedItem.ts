import { POTENTIAL_GRADE } from "../../constants/enhance/potential";
import { ItemEquipmentDetail } from "../character/itemEquipment/itemEquipment";

export interface EnhancedItem {
  before: ItemEquipmentDetail;
  after: ItemEquipmentDetail;
  used: Material[];
  rollCounts: Partial<Record<POTENTIAL_GRADE, number>>;
  additionalRollCounts: Partial<Record<POTENTIAL_GRADE, number>>;
}

export interface Material {
  name: string;
  value: number;
}
