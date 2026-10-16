import type { FaqItem } from "@/components/marketing/FaqAccordion";
import { marketingText } from "@/lib/marketing/text";
import { MARKETING } from "./siteConfig";

export type FaqCategory = {
  id: string;
  title: string;
  description: string;
  items: FaqItem[];
};

export const FAQ_PAGE = {
  get eyebrow() { return marketingText("faq.eyebrow"); },
  get title() { return marketingText("faq.title"); },
  get description() { return marketingText("faq.description"); },
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "product",
    get title() { return marketingText("faq.productTitle"); },
    get description() { return marketingText("faq.productDescription"); },
    get items(): FaqItem[] {
      return [
        { question: marketingText("faq.qWhat"), answer: marketingText("faq.aWhat") },
        { question: marketingText("faq.qWho"), answer: marketingText("faq.aWho") },
        { question: marketingText("faq.qRemote"), answer: marketingText("faq.aRemote") },
        { question: marketingText("faq.qClock"), answer: marketingText("faq.aClock") },
      ];
    },
  },
  {
    id: "access",
    get title() { return marketingText("faq.accessTitle"); },
    get description() { return marketingText("faq.accessDescription"); },
    get items(): FaqItem[] {
      return [
        { question: marketingText("faq.qStart"), answer: marketingText("faq.aStart") },
        { question: marketingText("faq.qAgain"), answer: marketingText("faq.aAgain") },
        { question: marketingText("faq.qAccount"), answer: marketingText("faq.aAccount") },
      ];
    },
  },
  {
    id: "platform",
    get title() { return marketingText("faq.platformTitle"); },
    get description() { return marketingText("faq.platformDescription"); },
    get items(): FaqItem[] {
      return [
        { question: marketingText("faq.qApp"), answer: marketingText("faq.aApp") },
        { question: marketingText("faq.qDownload"), answer: marketingText("faq.aDownload") },
        { question: marketingText("faq.qBranches"), answer: marketingText("faq.aBranches") },
      ];
    },
  },
  {
    id: "support",
    get title() { return marketingText("faq.supportTitle"); },
    get description() { return marketingText("faq.supportDescription"); },
    get items(): FaqItem[] {
      const email = MARKETING.contactEmail;
      return [
        { question: marketingText("faq.qContact"), answer: marketingText("faq.aContact", { values: { email } }) },
        { question: marketingText("faq.qLegal"), answer: marketingText("faq.aLegal") },
        { question: marketingText("faq.qSecurity"), answer: marketingText("faq.aSecurity") },
      ];
    },
  },
];
