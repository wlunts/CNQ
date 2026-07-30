# -*- coding: utf-8 -*-
"""
照片分析模块 - Photo Analyzer
==============================
从验货照片中提取数据：
- 箱唛照片 → 箱规尺寸、毛重净重、装箱数、PO号
- 产品照片 → 产品尺寸、颜色、材质
- 测量照片 → 实际测量值
- 标签/条码照片 → SKU、条码、批次
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
import json

try:
    from PIL import Image, ImageEnhance, ImageFilter
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

from config import (
    CARTON_DIMS_PATTERNS, WEIGHT_PATTERNS, QTY_PATTERNS,
    PRODUCT_DIMS_PATTERNS, PO_PATTERNS, PRODUCT_NAME_PATTERNS,
    MATERIAL_PATTERNS, COLOR_PATTERNS, BARCODE_PATTERNS,
    DATE_BATCH_PATTERNS, classify_photo_folder, parse_dimension_tuple,
)


@dataclass
class PhotoData:
    """单张照片的提取数据"""
    filename: str = ""
    category: str = "general"
    ocr_text: str = ""
    # 尺寸
    carton_dims: Optional[Dict[str, float]] = None   # {length, width, height}
    product_dims: Optional[Dict[str, float]] = None
    # 重量
    gross_weight: Optional[float] = None
    net_weight: Optional[float] = None
    weight_unit: str = "kg"
    # 数量
    qty_per_carton: Optional[int] = None
    total_quantity: Optional[int] = None
    # 产品信息
    product_name: Optional[str] = None
    po_number: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    barcode_sku: Optional[str] = None
    mfg_date: Optional[str] = None
    batch_lot: Optional[str] = None
    # 元数据
    confidence: float = 0.0
    raw_matches: Dict[str, list] = field(default_factory=dict)


@dataclass
class ExtractionResult:
    """整批照片的汇总提取结果"""
    source_dir: str = ""
    total_photos: int = 0
    categorized: Dict[str, List[PhotoData]] = field(default_factory=dict)
    consolidated: Dict[str, Any] = field(default_factory=dict)


class PhotoAnalyzer:
    """
    验货照片分析器
    
    支持两种模式：
    1. Tesseract OCR（本地离线）
    2. 手动输入模式（无 OCR 时的降级方案）
    """
    
    def __init__(self, tesseract_cmd: Optional[str] = None, lang: str = "chi_sim+eng"):
        """
        Args:
            tesseract_cmd: Tesseract 可执行文件路径（Windows 通常需要指定）
            lang: OCR 语言，默认中英文
        """
        self.tesseract_cmd = tesseract_cmd
        self.lang = lang
        self.ocr_available = False
        
        if HAS_TESSERACT:
            if tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            try:
                # 验证 tesseract 可用
                pytesseract.get_tesseract_version()
                self.ocr_available = True
                print(f"✓ Tesseract OCR 已就绪 (语言: {lang})")
            except Exception as e:
                print(f"⚠ Tesseract 未配置或不可用: {e}")
                print("  将使用手动数据输入模式。如需 OCR，请安装 Tesseract:")
                print("  https://github.com/UB-Mannheim/tesseract/wiki")
        else:
            print("⚠ pytesseract 未安装。运行: pip install pytesseract")
            print("  将使用手动数据输入模式。")
    
    # ── 预处理 ────────────────────────────────────────────
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """图像预处理：增强 OCR 识别率"""
        # 转灰度
        gray = image.convert("L")
        # 提高对比度
        enhancer = ImageEnhance.Contrast(gray)
        gray = enhancer.enhance(2.0)
        # 锐化
        enhancer = ImageEnhance.Sharpness(gray)
        gray = enhancer.enhance(2.0)
        return gray
    
    def _preprocess_image_cv2(self, image_path: str) -> Optional[Image.Image]:
        """使用 OpenCV 做更强预处理（可选）"""
        if not HAS_CV2:
            return None
        img = cv2.imread(image_path)
        if img is None:
            return None
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # 自适应阈值二值化
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        # 降噪
        denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)
        return Image.fromarray(denoised)
    
    # ── OCR 识别 ──────────────────────────────────────────
    
    def _ocr_image(self, image_path: str, preprocess: bool = True) -> str:
        """对单张图片执行 OCR"""
        if not self.ocr_available:
            return ""
        
        try:
            # 尝试 OpenCV 预处理
            if preprocess and HAS_CV2:
                processed = self._preprocess_image_cv2(image_path)
                if processed:
                    text = pytesseract.image_to_string(processed, lang=self.lang)
                    if text.strip():
                        return text
            
            # Pillow 预处理
            if preprocess and HAS_PIL:
                pil_img = Image.open(image_path)
                processed = self._preprocess_image(pil_img)
                text = pytesseract.image_to_string(processed, lang=self.lang)
                return text
            
            # 直接 OCR
            text = pytesseract.image_to_string(image_path, lang=self.lang)
            return text
        except Exception as e:
            print(f"  ⚠ OCR 失败 ({os.path.basename(image_path)}): {e}")
            return ""
    
    # ── 数据提取 ──────────────────────────────────────────
    
    def _extract_from_text(self, text: str, category: str = "general") -> PhotoData:
        """从 OCR 文本中提取结构化数据"""
        data = PhotoData(ocr_text=text, category=category)
        
        if not text.strip():
            return data
        
        # 箱规尺寸
        dims_matches = []
        for pat in CARTON_DIMS_PATTERNS:
            found = pat.findall(text)
            if found:
                dims_matches.extend(found)
                data.raw_matches["carton_dims"] = found
        if dims_matches:
            parsed = parse_dimension_tuple(dims_matches[0])
            if parsed:
                data.carton_dims = parsed
        
        # 产品尺寸
        prod_dims_matches = []
        for pat in PRODUCT_DIMS_PATTERNS:
            found = pat.findall(text)
            if found:
                prod_dims_matches.extend(found)
                data.raw_matches["product_dims"] = found
        if prod_dims_matches:
            parsed = parse_dimension_tuple(prod_dims_matches[0])
            if parsed:
                data.product_dims = parsed
        
        # 重量
        for pat in WEIGHT_PATTERNS:
            found = pat.findall(text)
            if found:
                data.raw_matches["weight"] = found
                for match in found:
                    val = match[0] if isinstance(match, tuple) else match
                    try:
                        val = float(val)
                        if "gross" in pat.pattern.lower() or "毛重" in pat.pattern or "G.W" in pat.pattern:
                            data.gross_weight = val
                        elif "net" in pat.pattern.lower() or "净重" in pat.pattern or "N.W" in pat.pattern:
                            data.net_weight = val
                        else:
                            if data.gross_weight is None:
                                data.gross_weight = val
                        if "lb" in pat.pattern.lower() or "磅" in pat.pattern:
                            data.weight_unit = "lb"
                        elif "g" in pat.pattern.lower() or "克" in pat.pattern:
                            data.weight_unit = "g"
                    except ValueError:
                        pass
        
        # 装箱数量
        for pat in QTY_PATTERNS:
            found = pat.findall(text)
            if found:
                data.raw_matches["quantity"] = found
                try:
                    data.qty_per_carton = int(found[0])
                except (ValueError, TypeError):
                    pass
                break
        
        # PO 号
        for pat in PO_PATTERNS:
            found = pat.findall(text)
            if found:
                data.raw_matches["po"] = found
                data.po_number = str(found[0]).strip()
                break
        
        # 产品名称
        for pat in PRODUCT_NAME_PATTERNS:
            found = pat.findall(text)
            if found:
                data.product_name = str(found[0]).strip()
                break
        
        # 材质
        for pat in MATERIAL_PATTERNS:
            found = pat.findall(text)
            if found:
                data.material = str(found[0]).strip()
                break
        
        # 颜色
        for pat in COLOR_PATTERNS:
            found = pat.findall(text)
            if found:
                data.color = str(found[0]).strip()
                break
        
        # 条码/SKU
        for pat in BARCODE_PATTERNS:
            found = pat.findall(text)
            if found:
                data.barcode_sku = str(found[0]).strip()
                break
        
        # 日期/批号
        for pat in DATE_BATCH_PATTERNS:
            found = pat.findall(text)
            if found:
                data.raw_matches["date_batch"] = found
                match_str = str(found[0]).strip()
                if re.match(r'\d{4}', match_str):
                    data.mfg_date = match_str
                else:
                    data.batch_lot = match_str
        
        return data
    
    # ── 主入口：分析整个照片目录 ──────────────────────────
    
    def analyze_directory(self, photos_dir: str, recursive: bool = True) -> ExtractionResult:
        """
        分析照片目录
        
        目录结构示例：
        photos/
        ├── 01_箱唛/
        │   ├── carton1.jpg
        │   └── carton2.jpg
        ├── 02_产品照片/
        │   └── product1.jpg
        ├── 03_测量/
        │   └── dimension1.jpg
        └── 04_缺陷/
            └── defect1.jpg
        
        Args:
            photos_dir: 照片根目录
            recursive: 是否递归搜索子文件夹
        
        Returns:
            ExtractionResult 包含所有提取的数据
        """
        photos_path = Path(photos_dir)
        if not photos_path.exists():
            raise FileNotFoundError(f"照片目录不存在: {photos_dir}")
        
        result = ExtractionResult(source_dir=str(photos_path))
        supported_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
        
        # 检查目录结构：是否按类别分子文件夹
        subdirs = [d for d in photos_path.iterdir() if d.is_dir()]
        has_categories = len(subdirs) > 0
        
        if has_categories:
            # 分子文件夹处理
            print(f"\n📂 发现 {len(subdirs)} 个照片分类文件夹:")
            for subdir in sorted(subdirs):
                category = classify_photo_folder(subdir.name)
                photos = [f for f in subdir.iterdir() 
                         if f.suffix.lower() in supported_formats]
                if not photos:
                    continue
                
                print(f"  [{category}] {subdir.name} ({len(photos)} 张)")
                result.total_photos += len(photos)
                
                for photo in sorted(photos):
                    print(f"    → 分析: {photo.name}")
                    ocr_text = self._ocr_image(str(photo))
                    data = self._extract_from_text(ocr_text, category)
                    data.filename = photo.name
                    
                    if category not in result.categorized:
                        result.categorized[category] = []
                    result.categorized[category].append(data)
        else:
            # 平铺照片，统一处理
            photos = [f for f in photos_path.iterdir() 
                     if f.is_file() and f.suffix.lower() in supported_formats]
            result.total_photos = len(photos)
            print(f"\n📂 发现 {len(photos)} 张照片（无分类子文件夹）")
            
            for photo in sorted(photos):
                print(f"  → 分析: {photo.name}")
                ocr_text = self._ocr_image(str(photo))
                data = self._extract_from_text(ocr_text, "general")
                data.filename = photo.name
                
                if "general" not in result.categorized:
                    result.categorized["general"] = []
                result.categorized["general"].append(data)
        
        # 汇总合并数据
        result.consolidated = self._consolidate_results(result)
        
        return result
    
    def _consolidate_results(self, result: ExtractionResult) -> Dict[str, Any]:
        """合并所有照片的提取数据，去重优先"""
        consolidated = {}
        
        # 按类别优先级：箱唛 > 标签 > 产品照片 > 测量
        priority_order = ["carton_mark", "label", "product", "measurement", "general"]
        
        # 收集所有数据
        all_data = []
        for cat in priority_order:
            if cat in result.categorized:
                all_data.extend(result.categorized[cat])
        # 补充其他类别
        for cat, data_list in result.categorized.items():
            if cat not in priority_order:
                all_data.extend(data_list)
        
        # 合并规则：取第一个有值的数据（按优先级）
        string_fields = ["product_name", "po_number", "material", "color", 
                        "barcode_sku", "mfg_date", "batch_lot"]
        numeric_fields = ["gross_weight", "net_weight", "qty_per_carton", "total_quantity"]
        dims_fields = ["carton_dims", "product_dims"]
        
        for field in string_fields:
            for data in all_data:
                val = getattr(data, field, None)
                if val and val.strip():
                    consolidated[field] = val
                    break
        
        for field in numeric_fields:
            for data in all_data:
                val = getattr(data, field, None)
                if val is not None:
                    consolidated[field] = val
                    break
        
        for field in dims_fields:
            for data in all_data:
                val = getattr(data, field, None)
                if val:
                    consolidated[field] = val
                    break
        
        # 权重单位
        for data in all_data:
            if data.weight_unit:
                consolidated["weight_unit"] = data.weight_unit
                break
        
        return consolidated
    
    # ── 降级模式：手动输入 ────────────────────────────────
    
    def manual_input_mode(self) -> Dict[str, Any]:
        """交互式手动输入验货数据（无 OCR 时使用）"""
        print("\n" + "=" * 60)
        print("  📝 手动数据输入模式")
        print("  请逐项输入（直接回车跳过）：")
        print("=" * 60 + "\n")
        
        data = {}
        
        def ask(label: str, key: str, cast=str):
            val = input(f"  {label}: ").strip()
            if val:
                try:
                    data[key] = cast(val)
                except ValueError:
                    print(f"    ⚠ 格式错误，跳过")
        
        ask("PO 号", "po_number")
        ask("产品名称 / 描述", "product_name")
        ask("材质", "material")
        ask("颜色", "color")
        ask("条码 / SKU", "barcode_sku")
        ask("批号", "batch_lot")
        ask("生产日期 (YYYY-MM-DD)", "mfg_date")
        
        # 外箱尺寸
        print("  --- 外箱尺寸 ---")
        l = input("  长 (cm): ").strip()
        w = input("  宽 (cm): ").strip()
        h = input("  高 (cm): ").strip()
        if l and w and h:
            try:
                data["carton_dims"] = {
                    "length": float(l), "width": float(w), "height": float(h)
                }
            except ValueError:
                pass
        
        # 产品尺寸
        print("  --- 产品尺寸 ---")
        l = input("  长 (cm): ").strip()
        w = input("  宽 (cm): ").strip()
        h = input("  高 (cm): ").strip()
        if l and w and h:
            try:
                data["product_dims"] = {
                    "length": float(l), "width": float(w), "height": float(h)
                }
            except ValueError:
                pass
        
        # 重量
        ask("毛重", "gross_weight", float)
        ask("净重", "net_weight", float)
        wt_unit = input("  重量单位 [kg/lb/g] (默认 kg): ").strip()
        if wt_unit:
            data["weight_unit"] = wt_unit
        
        # 数量
        ask("装箱数 (pcs/箱)", "qty_per_carton", int)
        ask("总数量", "total_quantity", int)
        
        return data
    
    # ── 工具方法 ──────────────────────────────────────────
    
    def export_result(self, result: ExtractionResult, output_path: str) -> str:
        """将提取结果导出为 JSON"""
        output = {
            "source_dir": result.source_dir,
            "total_photos": result.total_photos,
            "consolidated": result.consolidated,
            "categories": {},
        }
        for cat, data_list in result.categorized.items():
            output["categories"][cat] = [asdict(d) for d in data_list]
        
        out_path = Path(output_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"📄 提取数据已导出: {out_path}")
        return str(out_path)
    
    def print_summary(self, result: ExtractionResult):
        """打印提取摘要"""
        c = result.consolidated
        print("\n" + "━" * 50)
        print("  📊 照片分析摘要")
        print("━" * 50)
        print(f"  照片总数: {result.total_photos}")
        print(f"  分类数: {len(result.categorized)}")
        
        if c.get("po_number"):
            print(f"  PO 号: {c['po_number']}")
        if c.get("product_name"):
            print(f"  产品名称: {c['product_name']}")
        if c.get("carton_dims"):
            d = c["carton_dims"]
            print(f"  箱规: {d['length']} x {d['width']} x {d['height']} cm")
        if c.get("product_dims"):
            d = c["product_dims"]
            print(f"  产品尺寸: {d['length']} x {d['width']} x {d['height']} cm")
        if c.get("gross_weight"):
            unit = c.get("weight_unit", "kg")
            print(f"  毛重: {c['gross_weight']} {unit}")
        if c.get("net_weight"):
            unit = c.get("weight_unit", "kg")
            print(f"  净重: {c['net_weight']} {unit}")
        if c.get("qty_per_carton"):
            print(f"  装箱数: {c['qty_per_carton']} pcs/箱")
        if c.get("material"):
            print(f"  材质: {c['material']}")
        if c.get("color"):
            print(f"  颜色: {c['color']}")
        print("━" * 50)


# ── 快速入口 ─────────────────────────────────────────────

def analyze_photos(photos_dir: str, tesseract_cmd: str = None, 
                   manual_fallback: bool = True) -> ExtractionResult:
    """
    快速分析照片目录
    
    Args:
        photos_dir: 照片目录路径
        tesseract_cmd: Tesseract 路径
        manual_fallback: OCR 失败时是否降级到手动输入
    
    Returns:
        ExtractionResult
    """
    analyzer = PhotoAnalyzer(tesseract_cmd=tesseract_cmd)
    
    if analyzer.ocr_available:
        return analyzer.analyze_directory(photos_dir)
    elif manual_fallback:
        print("\n⚠ OCR 不可用，切换到手动输入模式...\n")
        data = analyzer.manual_input_mode()
        result = ExtractionResult(
            source_dir=photos_dir,
            consolidated=data,
        )
        return result
    else:
        raise RuntimeError("OCR 不可用且禁用了手动输入。请安装 Tesseract 或启用 manual_fallback。")
