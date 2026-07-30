# -*- coding: utf-8 -*-
"""
数据比对模块 - Data Comparator
===============================
将照片提取的实测数据与验货资料中的规格标准进行比对，
自动识别不合格项并生成备注。

比对规则：
1. 尺寸比对（含公差）
2. 重量比对（含公差）
3. 材质/颜色一致性检查
4. PO 号/条码匹配性检查
5. 数量/装箱数核对
"""

from typing import Dict, List, Optional, Any, Tuple


class DataComparator:
    """
    验货数据比对器
    
    将实测数据与规格标准逐一比对，
    输出比对结果和不合格项列表。
    """
    
    # 默认公差
    DEFAULT_TOLERANCES = {
        "carton_dims": 0.5,        # 外箱尺寸公差 ±0.5 cm
        "product_dims": 0.3,       # 产品尺寸公差 ±0.3 cm
        "gross_weight": 0.1,       # 重量公差 ±0.1 kg
        "net_weight": 0.05,        # 净重公差 ±0.05 kg
    }
    
    def __init__(self, tolerances: Dict[str, float] = None):
        self.tolerances = tolerances or self.DEFAULT_TOLERANCES.copy()
    
    # ── 主比对入口 ────────────────────────────────────────
    
    def compare(self, extracted: Dict[str, Any], specs: Dict[str, Any]) -> Dict[str, Any]:
        """
        全面比对实测数据与规格标准
        
        Args:
            extracted: 照片提取数据（PhotoAnalyzer 输出）
            specs: 验货资料规格（SpecParser 输出）
        
        Returns:
            {
                "comparisons": [...],       # 每项比对结果
                "passed_count": int,        # 通过数
                "failed_count": int,        # 不合格数
                "skipped_count": int,       # 跳过数（无数据可比）
                "overall_result": "PASS" | "FAIL" | "INCOMPLETE",
                "remarks": str,             # 自动生成的备注摘要
            }
        """
        print("\n" + "═" * 50)
        print("  🔍 数据比对")
        print("═" * 50)
        
        comparisons = []
        
        # 1. 外箱尺寸比对
        comparisons.extend(self._compare_dims(
            extracted.get("carton_dims", {}),
            specs.get("carton_dims", {}),
            field_name="外箱尺寸 (Carton Dims)",
            tolerance=self.tolerances.get("carton_dims", 0.5),
            unit="cm",
        ))
        
        # 2. 产品尺寸比对
        comparisons.extend(self._compare_dims(
            extracted.get("product_dims", {}),
            specs.get("product_dims", {}),
            field_name="产品尺寸 (Product Dims)",
            tolerance=self.tolerances.get("product_dims", 0.3),
            unit="cm",
        ))
        
        # 3. 毛重比对
        comparisons.append(self._compare_numeric(
            extracted.get("gross_weight"),
            specs.get("gross_weight"),
            field_name="毛重 (Gross Weight)",
            tolerance=self.tolerances.get("gross_weight", 0.1),
            unit=extracted.get("weight_unit", "kg"),
        ))
        
        # 4. 净重比对
        comparisons.append(self._compare_numeric(
            extracted.get("net_weight"),
            specs.get("net_weight"),
            field_name="净重 (Net Weight)",
            tolerance=self.tolerances.get("net_weight", 0.05),
            unit=extracted.get("weight_unit", "kg"),
        ))
        
        # 5. 装箱数比对
        comparisons.append(self._compare_numeric(
            extracted.get("qty_per_carton"),
            specs.get("qty_per_carton"),
            field_name="装箱数 (Qty/Ctn)",
            tolerance=0,
            unit="pcs",
        ))
        
        # 6. 字符串字段比对
        for field, label in [
            ("product_name", "产品名称"),
            ("po_number", "PO 号"),
            ("material", "材质"),
            ("color", "颜色"),
            ("barcode_sku", "条码/SKU"),
        ]:
            comparisons.append(self._compare_string(
                extracted.get(field),
                specs.get(field),
                field_name=label,
            ))
        
        # 统计
        passed = [c for c in comparisons if c.get("passed") is True]
        failed = [c for c in comparisons if c.get("passed") is False]
        skipped = [c for c in comparisons if c.get("passed") is None]
        
        # 生成备注
        remarks = self._generate_remarks(failed)
        
        result = {
            "comparisons": comparisons,
            "passed_count": len(passed),
            "failed_count": len(failed),
            "skipped_count": len(skipped),
            "overall_result": "PASS" if len(failed) == 0 else "FAIL",
            "remarks": remarks,
        }
        
        self._print_result(result)
        return result
    
    # ── 尺寸比对 ──────────────────────────────────────────
    
    def _compare_dims(self, extracted: Dict, specs: Dict,
                      field_name: str, tolerance: float,
                      unit: str = "cm") -> List[Dict]:
        """比对外箱/产品尺寸"""
        comparisons = []
        
        if not extracted and not specs:
            comparisons.append({
                "field": field_name,
                "passed": None,
                "remark": "无数据，跳过比对",
            })
            return comparisons
        
        dim_labels = [
            ("length", "长 (L)"),
            ("width", "宽 (W)"),
            ("height", "高 (H)"),
        ]
        
        extracted_vals = {}
        spec_vals = {}
        
        for key, label in dim_labels:
            ext_val = extracted.get(key) if isinstance(extracted, dict) else None
            spc_val = specs.get(key) if isinstance(specs, dict) else None
            
            extracted_vals[label] = ext_val
            spec_vals[label] = spc_val
            
            if ext_val is None and spc_val is None:
                comparisons.append({
                    "field": f"{field_name} - {label}",
                    "passed": None,
                    "remark": "无数据",
                })
                continue
            
            if ext_val is None:
                comparisons.append({
                    "field": f"{field_name} - {label}",
                    "passed": None,
                    "expected": spc_val,
                    "actual": "缺失",
                    "remark": "未从照片中提取到数据",
                })
                continue
            
            if spc_val is None:
                comparisons.append({
                    "field": f"{field_name} - {label}",
                    "passed": None,
                    "expected": "无规格",
                    "actual": ext_val,
                    "remark": "验货资料中无此规格",
                })
                continue
            
            try:
                ext_val = float(ext_val)
                spc_val = float(spc_val)
                diff = abs(ext_val - spc_val)
                passed = diff <= tolerance
                
                comparisons.append({
                    "field": f"{field_name} - {label}",
                    "passed": passed,
                    "expected": f"{spc_val} {unit}",
                    "actual": f"{ext_val} {unit}",
                    "diff": f"{diff:.2f} {unit}",
                    "tolerance": f"±{tolerance} {unit}",
                    "remark": "合格" if passed else f"偏差 {diff:.2f}{unit}，超出公差 ±{tolerance}{unit}",
                })
            except (ValueError, TypeError):
                comparisons.append({
                    "field": f"{field_name} - {label}",
                    "passed": None,
                    "expected": spc_val,
                    "actual": ext_val,
                    "remark": "数据格式异常，无法比对",
                })
        
        return comparisons
    
    # ── 数值比对 ──────────────────────────────────────────
    
    def _compare_numeric(self, extracted, spec, field_name: str,
                         tolerance: float = 0, unit: str = "") -> Dict:
        """比对单个数值"""
        if extracted is None and spec is None:
            return {
                "field": field_name,
                "passed": None,
                "remark": "无数据，跳过比对",
            }
        
        if extracted is None:
            return {
                "field": field_name,
                "passed": None,
                "expected": self._fmt(spec, unit),
                "actual": "缺失",
                "remark": "未从照片中提取到数据",
            }
        
        if spec is None:
            return {
                "field": field_name,
                "passed": None,
                "expected": "无规格",
                "actual": self._fmt(extracted, unit),
                "remark": "验货资料中无此规格",
            }
        
        try:
            ext_val = float(extracted)
            spc_val = float(spec)
            diff = abs(ext_val - spc_val)
            passed = diff <= tolerance
            
            return {
                "field": field_name,
                "passed": passed,
                "expected": self._fmt(spc_val, unit),
                "actual": self._fmt(ext_val, unit),
                "diff": self._fmt(diff, unit),
                "tolerance": f"±{tolerance} {unit}".strip(),
                "remark": "合格" if passed else f"偏差 {diff:.2f}{unit}，标准 {spc_val}{unit}，实测 {ext_val}{unit}",
            }
        except (ValueError, TypeError):
            return {
                "field": field_name,
                "passed": None,
                "expected": spec,
                "actual": extracted,
                "remark": "数据格式异常，无法比对",
            }
    
    # ── 字符串比对 ────────────────────────────────────────
    
    def _compare_string(self, extracted, spec, field_name: str) -> Dict:
        """比对字符串字段"""
        if not extracted and not spec:
            return {
                "field": field_name,
                "passed": None,
                "remark": "无数据，跳过比对",
            }
        
        if not extracted:
            return {
                "field": field_name,
                "passed": None,
                "expected": spec,
                "actual": "缺失",
                "remark": "未从照片中提取到数据",
            }
        
        if not spec:
            return {
                "field": field_name,
                "passed": None,
                "expected": "无规格",
                "actual": extracted,
                "remark": "验货资料中无此规格",
            }
        
        # 标准化比对
        ext_clean = str(extracted).strip().lower()
        spc_clean = str(spec).strip().lower()
        
        passed = ext_clean == spc_clean
        
        # 部分匹配也算通过（如果一个是另一个的子串）
        if not passed:
            if ext_clean in spc_clean or spc_clean in ext_clean:
                passed = True
                remark = "部分匹配"
            else:
                remark = f"不一致: 资料为「{spec}」，实测为「{extracted}」"
        else:
            remark = "一致"
        
        return {
            "field": field_name,
            "passed": passed,
            "expected": str(spec),
            "actual": str(extracted),
            "remark": remark,
        }
    
    # ── 备注生成 ──────────────────────────────────────────
    
    def _generate_remarks(self, failed: List[Dict]) -> str:
        """根据不合格项自动生成备注文本"""
        if not failed:
            return "所有可比对项均符合规格要求。"
        
        lines = []
        for i, item in enumerate(failed, 1):
            lines.append(
                f"{i}. 【{item['field']}】{item.get('remark', '不合格')}"
            )
        
        return "\n".join(lines)
    
    # ── 工具方法 ──────────────────────────────────────────
    
    def _fmt(self, value, unit: str = "") -> str:
        """格式化数值"""
        if value is None:
            return ""
        try:
            return f"{float(value):.2f}{' ' + unit if unit else ''}"
        except (ValueError, TypeError):
            return f"{value}{' ' + unit if unit else ''}"
    
    def _print_result(self, result: Dict):
        """打印比对结果"""
        print(f"\n  通过: {result['passed_count']}  |  "
              f"不合格: {result['failed_count']}  |  "
              f"跳过: {result['skipped_count']}")
        print(f"  综合判定: {result['overall_result']}")
        
        if result["failed_count"] > 0:
            print("\n  ❌ 不合格项:")
            for comp in result["comparisons"]:
                if comp.get("passed") is False:
                    print(f"     - {comp['field']}: {comp['remark']}")
        
        print("═" * 50)


# ── 快速入口 ─────────────────────────────────────────────

def compare_data(extracted: Dict, specs: Dict,
                 tolerances: Dict = None) -> Dict[str, Any]:
    """快速比对"""
    comp = DataComparator(tolerances)
    return comp.compare(extracted, specs)
