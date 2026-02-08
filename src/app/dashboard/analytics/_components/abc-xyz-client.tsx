"use client";

import { useState } from "react";
import { ABCXYZMatrix } from "./abc-xyz-matrix";
import { ABCXYZTable, type ProductAnalysis } from "./abc-xyz-table";

interface MatrixCell {
  grade: string;
  count: number;
}

interface ABCXYZClientProps {
  matrixData: MatrixCell[];
  products: ProductAnalysis[];
}

export function ABCXYZClient({ matrixData, products }: ABCXYZClientProps) {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  const handleSelectGrade = (grade: string) => {
    setSelectedGrade(grade === selectedGrade ? null : grade);
  };

  return (
    <div className="space-y-6">
      <ABCXYZMatrix
        matrixData={matrixData}
        selectedGrade={selectedGrade}
        onSelectGrade={handleSelectGrade}
      />
      <ABCXYZTable products={products} selectedGrade={selectedGrade} />
    </div>
  );
}
