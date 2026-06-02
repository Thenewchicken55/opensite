import { z } from "zod";

export const MAX_ACTIONS = 20;
export const VALID_TAGS = [
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "button", "a", "img", "input", "textarea", "select", "option",
  "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td",
  "form", "label", "section", "article", "header", "footer", "nav",
  "main", "aside", "figure", "figcaption", "blockquote", "pre", "code",
  "hr", "br", "strong", "em", "small", "sub", "sup",
] as const;

const tagSchema = z.string().min(1).max(30);
const selectorSchema = z.string().min(1).max(200);
const attributesSchema = z.record(z.string(), z.string()).optional();

export const CreateAction = z.object({
  action: z.literal("create"),
  tag: tagSchema,
  parent: selectorSchema.optional(),
  content: z.string().optional(),
  attributes: attributesSchema,
});

export const UpdateAction = z.object({
  action: z.literal("update"),
  selector: selectorSchema,
  content: z.string().optional(),
  attributes: attributesSchema,
});

export const DeleteAction = z.object({
  action: z.literal("delete"),
  selector: selectorSchema,
});

export const StyleAction = z.object({
  action: z.literal("style"),
  selector: selectorSchema,
  styles: z.record(z.string(), z.string()),
});

export const InsertAction = z.object({
  action: z.literal("insert"),
  selector: selectorSchema,
  position: z.enum(["beforebegin", "afterbegin", "beforeend", "afterend"]),
  content: z.string(),
});

export const ReplaceAction = z.object({
  action: z.literal("replace"),
  selector: selectorSchema,
  tag: tagSchema,
  content: z.string().optional(),
  attributes: attributesSchema,
});

export const MoveAction = z.object({
  action: z.literal("move"),
  selector: selectorSchema,
  target: selectorSchema,
  position: z.enum(["beforebegin", "afterbegin", "beforeend", "afterend"]).optional(),
});

export const SetAttrAction = z.object({
  action: z.literal("setAttr"),
  selector: selectorSchema,
  name: z.string().min(1),
  value: z.string(),
});

export const RemoveAttrAction = z.object({
  action: z.literal("removeAttr"),
  selector: selectorSchema,
  name: z.string().min(1),
});

export const AddClassAction = z.object({
  action: z.literal("addClass"),
  selector: selectorSchema,
  class: z.string().min(1),
});

export const RemoveClassAction = z.object({
  action: z.literal("removeClass"),
  selector: selectorSchema,
  class: z.string().min(1),
});

export const DomAction = z.discriminatedUnion("action", [
  CreateAction,
  UpdateAction,
  DeleteAction,
  StyleAction,
  InsertAction,
  ReplaceAction,
  MoveAction,
  SetAttrAction,
  RemoveAttrAction,
  AddClassAction,
  RemoveClassAction,
]);

export const ActionList = z.array(DomAction).min(1).max(MAX_ACTIONS);

export type DomActionType = z.infer<typeof DomAction>;
export type CreateActionType = z.infer<typeof CreateAction>;
export type UpdateActionType = z.infer<typeof UpdateAction>;
export type DeleteActionType = z.infer<typeof DeleteAction>;
export type StyleActionType = z.infer<typeof StyleAction>;
export type InsertActionType = z.infer<typeof InsertAction>;
export type ReplaceActionType = z.infer<typeof ReplaceAction>;
export type MoveActionType = z.infer<typeof MoveAction>;
export type SetAttrActionType = z.infer<typeof SetAttrAction>;
export type RemoveAttrActionType = z.infer<typeof RemoveAttrAction>;
export type AddClassActionType = z.infer<typeof AddClassAction>;
export type RemoveClassActionType = z.infer<typeof RemoveClassAction>;
