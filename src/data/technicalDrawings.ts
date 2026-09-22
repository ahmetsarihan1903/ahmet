export interface TechnicalDrawing {
  id: string;
  title: string;
  src: string;
}

export const technicalDrawings: TechnicalDrawing[] = [
  {
    id: "ag-yan-sag",
    title: "Ağ – Sağ Yan",
    src: "/teknik-cizimler/ag-yan-sag.jpg"
  },
  {
    id: "ag-arka",
    title: "Ağ – Arka",
    src: "/teknik-cizimler/ag-arka.png"
  },
  {
    id: "ag-yan-sol",
    title: "Ağ – Sol Yan",
    src: "/teknik-cizimler/ag-yan-sol.png"
  },
  {
    id: "makine-sase-sag",
    title: "Makine Şasesi – Sağ",
    src: "/teknik-cizimler/makine-sase-sag.png"
  },
  {
    id: "makine-sase-sol",
    title: "Makine Şasesi – Sol",
    src: "/teknik-cizimler/makine-sase-sol.png"
  }
];
