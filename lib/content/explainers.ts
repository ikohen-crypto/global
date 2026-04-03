import { allIndicators } from "@/lib/indicators/registry";
import type { FaqItem, IndicatorId } from "@/lib/types";

export const homeExplainers = [
  {
    title: "What is GDP?",
    body: "GDP is the broadest measure of annual economic output. It helps you compare the overall size of economies, but it does not reveal how that output is distributed.",
  },
  {
    title: "What is inflation?",
    body: "Inflation tracks how quickly consumer prices are rising. High inflation can erode purchasing power and often shapes monetary policy.",
  },
  {
    title: "Why compare GDP per capita?",
    body: "GDP per capita adjusts for population size, which makes it more useful than total GDP when you want to compare average economic output per person.",
  },
];

export function getIndicatorFaqs(indicatorId: IndicatorId): FaqItem[] {
  const indicator = allIndicators.find((item) => item.id === indicatorId);
  if (!indicator) return [];

  return [
    {
      question: `What does ${indicator.shortLabel.toLowerCase()} measure?`,
      answer: indicator.description,
    },
    {
      question: `How should you interpret high or low ${indicator.shortLabel.toLowerCase()}?`,
      answer: indicator.interpretation,
    },
    {
      question: `What are the main limitations of ${indicator.shortLabel.toLowerCase()} data?`,
      answer: `${indicator.caveats} ${indicator.lagNote}`,
    },
  ];
}
