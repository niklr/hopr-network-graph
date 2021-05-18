export class GraphUtil {
  public static calculateNodeRadius(weight: number): number {
    return Math.min(10, Math.max(5, weight / 10));
  }
}
