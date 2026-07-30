# -*- coding: utf-8 -*-
"""
CNQ Inspection Report Automation Tool - Configuration
======================================================
定义验货报告中常见的数据模式、正则表达式和字段映射。
"""

import re
from pathlib import Path

# ── 项目根目录 ─────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent

# ── 默认输出目录 ───────────────────────────────────────────
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "output"
DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ══════════════════════════════════════════════════════════
#  OCR 提取正则模式
# ══════════════════════════════════════════════════════════

# 箱规 / 外箱尺寸
CARTON_DIMS_PATTERNS = [
    # 中文：箱规: 60x40x30 cm / 外箱尺寸：60*40*30cm
    re.compile(r'(?:箱规|外箱尺寸|纸箱尺寸|包装尺寸|Cartoon\s*Size|Carton\s*Size|CARTON\s*SIZE)[：:\s]*'
               r'(\d+\.?\d*)\s*[xX×\*]\s*(\d+\.?\d*)\s*[xX×\*]\s*(\d+\.?\d*)\s*(?:cm|CM|厘米|mm|MM|毫米)?',
               re.IGNORECASE),
    # 英文：Carton: 60 x 40 x 30 cm
    re.compile(r'(?:Cartoon|Carton|Outer\s*Box|Master\s*Carton)[：:\s]*'
               r'(\d+\.?\d*)\s*[xX×\*]\s*(\d+\.?\d*)\s*[xX×\*]\s*(\d+\.?\d*)\s*(?:cm|CM|厘米)?',
               re.IGNORECASE),
    # 简短: 60*40*30cm
    re.compile(r'(?<!\d)(\d{2,4})[xX\*×](\d{2,4})[xX\*×](\d{2,4})\s*(?:cm|CM|厘米)?(?!\d)'),
]

# 重量
WEIGHT_PATTERNS = [
    # 毛重
    re.compile(r'(?:毛重|总重|Gross\s*Weight|G\.?\s*W\.?|GROSS\s*WT)[：:\s]*'
               r'(\d+\.?\d*)\s*(?:kg|KG|千克|公斤|g|G|克|lb|LB|磅)?',
               re.IGNORECASE),
    # 净重
    re.compile(r'(?:净重|Net\s*Weight|N\.?\s*W\.?|NET\s*WT)[：:\s]*'
               r'(\d+\.?\d*)\s*(?:kg|KG|千克|公斤|g|G|克|lb|LB|磅)?',
               re.IGNORECASE),
    # 单独数字+单位
    re.compile(r'(\d+\.?\d*)\s*(kg|KG|千克|公斤)\b'),
    re.compile(r'(\d+\.?\d*)\s*(g|G|克)\b'),
    re.compile(r'(\d+\.?\d*)\s*(lb|LB|磅)\b'),
]

# 数量
QTY_PATTERNS = [
    re.compile(r'(?:数量|Quantity|QTY|Q\'?TY|PCS|pcs)[：:\s]*(\d+)\s*(?:pcs|PCS|个|件)?', re.IGNORECASE),
    re.compile(r'(?:装箱数|入数|Packing\s*Qty|Pack\s*Qty)[：:\s]*(\d+)', re.IGNORECASE),
]

# 产品尺寸
PRODUCT_DIMS_PATTERNS = [
    re.compile(r'(?:产品尺寸|Product\s*Size|Item\s*Size|Unit\s*Size)[：:\s]*'
               r'(\d+\.?\d*)\s*[xX×\*]\s*(\d+\.?\d*)\s*[xX×\*]\s*(\d+\.?\d*)\s*(?:cm|CM|厘米|mm|MM|毫米)?',
               re.IGNORECASE),
    re.compile(r'(?:Size|尺寸|规格)[：:\s]*'
               r'(\d+\.?\d*)\s*[xX×\*]\s*(\d+\.?\d*)\s*[xX×\*]\s*(\d+\.?\d*)\s*(?:cm|CM|厘米)?',
               re.IGNORECASE),
]

# PO号 / 订单号
PO_PATTERNS = [
    re.compile(r'(?:PO\s*(?:#|No|Number|号)?|订单号|Order\s*No|P\.?\s*O\.?\s*Number)[：:\s]*([A-Za-z0-9\-_]+)', re.IGNORECASE),
    re.compile(r'P\.?\s*O\.?\s*[:：\s]*#?\s*([A-Za-z0-9\-_]+)', re.IGNORECASE),
]

# 产品名称 / 描述
PRODUCT_NAME_PATTERNS = [
    re.compile(r'(?:产品名称|品名|Description|DESC|Item\s*Name|Product\s*Name)[：:\s]*(.+?)(?:\n|$)', re.IGNORECASE),
    re.compile(r'(?:ITEM|Article)[：:\s]*(.+?)(?:\n|$)', re.IGNORECASE),
]

# 材质 / 材料
MATERIAL_PATTERNS = [
    re.compile(r'(?:材质|材料|Material|MATL)[：:\s]*(.+?)(?:\n|$)', re.IGNORECASE),
]

# 颜色
COLOR_PATTERNS = [
    re.compile(r'(?:颜色|Color|Colour)[：:\s]*(.+?)(?:\n|$)', re.IGNORECASE),
]

# 条形码 / SKU
BARCODE_PATTERNS = [
    re.compile(r'(?:条码|条形码|Barcode|UPC|EAN|SKU)[：:\s]*([A-Za-z0-9\-_]+)', re.IGNORECASE),
]

# 生产日期 / 批号
DATE_BATCH_PATTERNS = [
    re.compile(r'(?:生产日期|MFG|Mfg\s*Date|Manufacturing\s*Date|Date)[：:\s]*'
               r'(\d{4}[-/.\s]*\d{1,2}[-/.\s]*\d{1,2}|\d{1,2}[-/.\s]*\d{1,2}[-/.\s]*\d{4})', re.IGNORECASE),
    re.compile(r'(?:批号|批次|Batch\s*No|Lot\s*No|Batch)[：:\s]*([A-Za-z0-9\-_]+)', re.IGNORECASE),
]

# ══════════════════════════════════════════════════════════
#  字段映射：OCR 提取 → 报告字段
# ══════════════════════════════════════════════════════════

FIELD_MAPPING = {
    "carton_length": ["箱规_长", "Carton_Length", "Outer_Carton_L", "外箱长"],
    "carton_width":  ["箱规_宽", "Carton_Width",  "Outer_Carton_W", "外箱宽"],
    "carton_height": ["箱规_高", "Carton_Height", "Outer_Carton_H", "外箱高"],
    "carton_unit":   ["箱规_单位", "Carton_Unit"],
    
    "gross_weight":  ["毛重", "Gross_Weight", "G.W.", "GROSS_WEIGHT"],
    "net_weight":    ["净重", "Net_Weight",   "N.W.", "NET_WEIGHT"],
    "weight_unit":   ["重量单位", "Weight_Unit"],
    
    "quantity_per_carton": ["装箱数", "Qty_Per_Carton", "PCS/CTN", "入数"],
    "total_quantity":      ["总数量", "Total_Qty", "Total_Quantity"],
    
    "product_length": ["产品长", "Product_L", "Item_L"],
    "product_width":  ["产品宽", "Product_W", "Item_W"],
    "product_height": ["产品高", "Product_H", "Item_H"],
    "product_unit":   ["产品尺寸单位", "Product_Unit"],
    
    "product_name":   ["产品名称", "Product_Name", "Description", "品名"],
    "po_number":      ["PO号", "PO_Number", "Order_No"],
    "material":       ["材质", "Material"],
    "color":          ["颜色", "Color"],
    "barcode_sku":    ["条码/SKU", "Barcode", "SKU"],
    "mfg_date":       ["生产日期", "MFG_Date"],
    "batch_lot":      ["批号", "Batch_No", "Lot_No"],
}

# ══════════════════════════════════════════════════════════
#  模板占位符模式（在 .docx 模板中查找）
# ══════════════════════════════════════════════════════════

# 占位符格式：{{FIELD_NAME}} 或 【FIELD_NAME】 或 ___FIELD_NAME___
PLACEHOLDER_PATTERN = re.compile(
    r'\{\{(.+?)\}\}|【(.+?)】|___(.+?)___'
)

# 常用报告段落标记（在 docx 表格中查找的列标题关键词）
REPORT_TABLE_HEADERS = {
    "general":    ["General Information", "基本信息", "Order Info", "订单信息"],
    "specs":      ["Specifications", "规格参数", "Product Specs", "产品规格"],
    "carton":     ["Carton Info", "Packaging", "包装信息", "Carton / Packing"],
    "inspection": ["Inspection Results", "检验结果", "AQL Results", "抽样结果"],
    "defects":    ["Defects", "Defect Summary", "缺陷汇总", "不合格项"],
    "tests":      ["On-site Tests", "现场测试", "Functional Tests"],
    "conclusion": ["Conclusion", "结论", "Overall Result", "综合判定"],
    "remarks":    ["Remarks", "备注", "Notes", "Comments", "附注"],
}

# ══════════════════════════════════════════════════════════
#  照片分类关键词（识别用户照片子文件夹的目的）
# ══════════════════════════════════════════════════════════

PHOTO_CATEGORIES = {
    "carton_mark":    ["箱唛", "carton_mark", "外箱", "carton", "唛头", "shipping_mark", "箱标"],
    "product":        ["产品", "product", "item", "goods", "单品"],
    "label":          ["标签", "label", "sticker", "hangtag", "吊牌"],
    "measurement":    ["测量", "measure", "尺寸测量", "dimension", "ruler", "卡尺", "caliper"],
    "weight":         ["称重", "weight", "scale", "重量", "weighing"],
    "defect":         ["缺陷", "defect", "不良", "瑕疵", "问题", "issue", "damage"],
    "packaging":      ["包装", "packaging", "packing", "inner_box", "内盒"],
    "barcode":        ["条码", "barcode", "scan", "扫描"],
    "overview":       ["全景", "overview", "整体", "full_view", "warehouse"],
    "test":           ["测试", "test", "testing", "拉力", "pull_test", "跌落", "drop"],
    "reference":      ["参考", "reference", "sample", "样品", "sealed_sample"],
}


def classify_photo_folder(folder_name: str) -> str:
    """根据文件夹名判断照片类别"""
    folder_lower = folder_name.lower().replace(" ", "_").replace("-", "_")
    for category, keywords in PHOTO_CATEGORIES.items():
        for kw in keywords:
            if kw in folder_lower:
                return category
    return "general"


def extract_measurement_value(text: str, pattern_list: list) -> list:
    """从文本中用正则列表提取数值，返回所有匹配"""
    results = []
    for pat in pattern_list:
        matches = pat.findall(text)
        results.extend(matches)
    return results


def parse_dimension_tuple(match) -> dict:
    """将尺寸匹配结果标准化为字典"""
    # match 可能是 (l, w, h) 元组
    if isinstance(match, (tuple, list)) and len(match) >= 3:
        try:
            return {
                "length": float(match[0]),
                "width": float(match[1]),
                "height": float(match[2]),
            }
        except (ValueError, TypeError):
            pass
    return {}
