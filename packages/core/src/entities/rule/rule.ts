export interface Rule {
  trigger: "before_edit" | "after_edit" | "before_complete" | "after_complete" | "on_conflict";
  instruction: string;
  id?: string;
}
