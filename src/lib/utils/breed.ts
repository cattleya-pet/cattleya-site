export function getAnimalTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    dog: '子犬',
    cat: '子猫',
  };
  return labels[type] || type;
}