#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CNQ 验货报告自动生成工具
========================
一键从验货照片、空白模板、验货资料生成完整验货报告。

使用方法：
    python main.py --photos ./photos --template ./template.docx --specs ./specs.xlsx

输入（4 个来源）：
    1. 照片文件夹（按类别分子文件夹）
    2. 空白报告模板（技术组已填基础数据）
    3. 验货资料（规格标准）
    4. 参考报告（格式参考，可选）

输出：
    ./output/Inspection_Report_<PO号>_<日期>.docx

首次使用：
    pip install -r requirements.txt
    # 安装 Tesseract OCR（Windows）：
    # https://github.com/UB-Mannheim/tesseract/wiki
"""

import sys
import os
from pathlib import Path

# 确保项目根目录在 sys.path 中
sys.path.insert(0, str(Path(__file__).resolve().parent))

from modules.photo_analyzer import PhotoAnalyzer, analyze_photos
from modules.spec_parser import SpecParser, parse_specs
from modules.comparator import DataComparator, compare_data
from modules.report_generator import ReportGenerator, generate_report
from config import DEFAULT_OUTPUT_DIR


def print_banner():
    """打印工具横幅"""
    print(r"""
  ╔══════════════════════════════════════╗
  ║   CNQ Inspection Report Generator   ║
  ║   验货报告自动生成工具  v1.0         ║
  ╚══════════════════════════════════════╝
    """)


def print_usage():
    """打印使用说明"""
    print("""
使用方法
────────
  python main.py [选项]

必需参数
────────
  --photos PATH      验货照片文件夹（按类别分子文件夹）
  --template PATH    空白报告模板 (.docx)
  --specs PATH       验货资料 / 规格标准 (.xlsx/.docx/.pdf)

可选参数
────────
  --reference PATH   完好的参考报告 (.docx)，用于学习格式
  --output NAME      输出文件名（默认自动生成）
  --output-dir PATH  输出目录（默认 ./output/）
  --tesseract PATH   Tesseract OCR 可执行文件路径
  --tolerance JSON   自定义公差，例: '{"carton_dims":0.5}'
  --manual           强制使用手动数据输入模式
  --no-ocr           禁用 OCR，仅用模板+资料生成框架

流程
────────
  1. 自动识别照片分类 → OCR 提取数据
  2. 解析验货资料 → 获取规格标准
  3. 实测 vs 标准比对 → 识别不合格项
  4. 填充模板 → 生成最终报告 → 输出 .docx + JSON

照片分类要求
────────
  将照片按类别放入子文件夹，工具会按文件夹名自动分类：
  
  photos/
  ├── 01_箱唛/       ← 外箱唛头、箱标
  ├── 02_产品/       ← 产品整体照片
  ├── 03_标签/       ← 标签、吊牌
  ├── 04_测量/       ← 卡尺、卷尺测量
  ├── 05_称重/       ← 电子秤称重
  ├── 06_缺陷/       ← 缺陷/不良照片
  └── 07_条码/       ← 条码扫描

  支持关键词: 箱唛/carton, 产品/product, 标签/label,
             测量/measure/卡尺, 称重/weight, 缺陷/defect,
             条码/barcode, 包装/packaging

模板占位符格式
────────
  模板中可使用以下占位符（工具会自动识别并替换）：
  {{Product_Name}}  {{PO_Number}}  {{Material}}  {{Color}}
  {{Carton_Dimensions}}  {{Carton_Length}}  {{Carton_Width}}  {{Carton_Height}}
  {{Gross_Weight}}  {{Net_Weight}}
  {{Product_Dimensions}}  {{Qty_Per_Carton}}
  {{Remarks}}  {{Non_Conformity_Count}}  {{Overall_Result}}
  
  也支持中文: {{产品名称}}  {{PO号}}  {{箱规}}  {{毛重}}  {{备注}}

示例
────────
  # 完整流程
  python main.py --photos ./inspection-photos/2025001/ \\
                 --template ./downloads/inspection-report-template-general.docx \\
                 --specs ./验货资料.xlsx \\
                 --reference ./参考报告.docx

  # 手动输入模式（无 OCR）
  python main.py --photos ./photos/ --template ./template.docx \\
                 --specs ./specs.xlsx --manual

  # 自定义公差
  python main.py --photos ./photos/ --template ./template.docx \\
                 --specs ./specs.xlsx \\
                 --tolerance '{"carton_dims":1.0,"product_dims":0.5}'
""")


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="CNQ 验货报告自动生成工具",
        add_help=False,
    )
    
    # 必需参数
    required = parser.add_argument_group("必需参数")
    required.add_argument("--photos", type=str,
                         help="验货照片文件夹路径")
    required.add_argument("--template", type=str,
                         help="空白报告模板 (.docx)")
    required.add_argument("--specs", type=str,
                         help="验货资料 / 规格文件 (.xlsx/.docx/.pdf)")
    
    # 可选参数
    optional = parser.add_argument_group("可选参数")
    optional.add_argument("--reference", type=str, default=None,
                         help="参考完好的报告 (.docx)")
    optional.add_argument("--output", type=str, default=None,
                         help="输出文件名")
    optional.add_argument("--output-dir", type=str, default=None,
                         help="输出目录 (默认: ./output/)")
    optional.add_argument("--tesseract", type=str, default=None,
                         help="Tesseract OCR 路径 (Windows 需指定)")
    optional.add_argument("--tolerance", type=str, default=None,
                         help='自定义公差 JSON，例: \'{"carton_dims":1.0}\'')
    optional.add_argument("--manual", action="store_true",
                         help="强制手动输入模式")
    optional.add_argument("--no-ocr", action="store_true",
                         help="禁用 OCR，跳过照片分析")
    optional.add_argument("--help", "-h", action="store_true",
                         help="显示帮助信息")
    
    args = parser.parse_args()
    
    # 显示帮助
    if args.help or not any([args.photos, args.template, args.specs]):
        print_banner()
        if args.help:
            print_usage()
            return
        if not args.photos and not args.template and not args.specs:
            print_usage()
            return
    
    print_banner()
    
    # ── 验证输入 ──────────────────────────────────────────
    
    has_photos = args.photos and Path(args.photos).exists()
    has_template = args.template and Path(args.template).exists()
    has_specs = args.specs and Path(args.specs).exists()
    has_reference = args.reference and Path(args.reference).exists()
    
    errors = []
    if args.photos and not has_photos:
        errors.append(f"照片目录不存在: {args.photos}")
    if args.template and not has_template:
        errors.append(f"模板文件不存在: {args.template}")
    if args.specs and not has_specs:
        errors.append(f"验货资料不存在: {args.specs}")
    if args.reference and not has_reference:
        print(f"⚠ 参考报告不存在，将跳过: {args.reference}")
    
    if errors:
        print("\n❌ 错误:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    
    # ── 设置输出目录 ──────────────────────────────────────
    
    output_dir = args.output_dir or str(DEFAULT_OUTPUT_DIR)
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # ── Step 1: 照片分析 ─────────────────────────────────
    
    print("\n" + "━" * 60)
    print("  📸 STEP 1/4: 照片分析")
    print("━" * 60)
    
    extracted_data = {}
    
    if args.no_ocr:
        print("  ⏭ 已禁用 OCR，跳过照片分析")
    elif not has_photos:
        print("  ⏭ 未提供照片，跳过照片分析")
        if args.manual:
            analyzer = PhotoAnalyzer(tesseract_cmd=args.tesseract)
            extracted_data = analyzer.manual_input_mode()
    else:
        try:
            result = analyze_photos(
                photos_dir=args.photos,
                tesseract_cmd=args.tesseract,
                manual_fallback=args.manual,
            )
            extracted_data = result.consolidated
            result.analyzer.print_summary(result) if hasattr(result, 'analyzer') else None
        except Exception as e:
            print(f"\n  ⚠ 照片分析出错: {e}")
            if args.manual:
                analyzer = PhotoAnalyzer()
                extracted_data = analyzer.manual_input_mode()
    
    # ── Step 2: 验货资料解析 ─────────────────────────────
    
    print("\n" + "━" * 60)
    print("  📄 STEP 2/4: 验货资料解析")
    print("━" * 60)
    
    specs_data = {}
    
    if has_specs:
        try:
            specs_data = parse_specs(args.specs)
        except Exception as e:
            print(f"  ⚠ 验货资料解析出错: {e}")
            print("  继续生成报告（无规格比对）...")
    else:
        print("  ⏭ 未提供验货资料，跳过")
    
    # ── Step 3: 数据比对 ─────────────────────────────────
    
    print("\n" + "━" * 60)
    print("  🔍 STEP 3/4: 数据比对")
    print("━" * 60)
    
    comparison_result = {}
    
    if extracted_data and specs_data:
        # 解析自定义公差
        tolerances = None
        if args.tolerance:
            import json
            try:
                tolerances = json.loads(args.tolerance)
            except json.JSONDecodeError:
                print(f"  ⚠ 公差 JSON 格式错误: {args.tolerance}")
        
        try:
            comparison_result = compare_data(extracted_data, specs_data, tolerances)
        except Exception as e:
            print(f"  ⚠ 比对出错: {e}")
            comparison_result = {
                "comparisons": [],
                "passed_count": 0,
                "failed_count": 0,
                "skipped_count": 0,
                "overall_result": "ERROR",
                "remarks": f"比对过程出错: {e}",
            }
    else:
        print("  ⏭ 缺少数据，跳过比对")
        comparison_result = {
            "comparisons": [],
            "passed_count": 0,
            "failed_count": 0,
            "skipped_count": 0,
            "overall_result": "N/A",
            "remarks": "",
        }
    
    # ── Step 4: 生成报告 ─────────────────────────────────
    
    print("\n" + "━" * 60)
    print("  📝 STEP 4/4: 生成报告")
    print("━" * 60)
    
    try:
        output_path = generate_report(
            template_path=args.template if has_template else "",
            extracted_data=extracted_data,
            specs_data=specs_data,
            comparison_result=comparison_result,
            reference_path=args.reference,
            output_filename=args.output,
        )
        
        print("\n" + "█" * 60)
        print(f"  🎉 完成！报告已生成: {output_path}")
        print("█" * 60)
        
    except Exception as e:
        print(f"\n  ❌ 报告生成失败: {e}")
        import traceback
        traceback.print_exc()
        
        # 降级：至少输出 JSON 数据
        print("\n  📄 降级输出: 生成 JSON 数据文件...")
        gen = ReportGenerator(output_dir)
        json_path = gen.generate_data_summary(
            extracted_data, specs_data, comparison_result
        )
        print(f"  数据已保存至: {json_path}")
        sys.exit(1)


if __name__ == "__main__":
    main()
