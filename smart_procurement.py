# -*- coding: utf-8 -*-
"""
 스마트 발주 시스템 (Smart Procurement System)
Streamlit 기반 자동화 발주 솔루션
"""

import streamlit as st
import openpyxl
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os

# 페이지 설정
st.set_page_config(
    page_title=" 스마트 발주 시스템",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 모노크롬 스타일 CSS (Black, White, Gray)
st.markdown("""
<style>
    /* 전체 배경 - 순수 검정 */
    .stApp {
        background-color: #0a0a0a !important;
        overflow-y: auto !important;
    }

    .main {
        background-color: #0a0a0a !important;
        overflow-y: auto !important;
    }

    /* 메인 컨테이너 */
    .block-container {
        padding-top: 1rem !important;
        padding-bottom: 2rem !important;
        max-width: 100% !important;
    }

    /* 상단 여백 제거 */
    .main .block-container {
        margin-top: 0 !important;
        padding-top: 1rem !important;
    }

    /* 메트릭 카드 */
    .metric-card {
        background: #1a1a1a;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
        border: 1px solid #3a3a3a;
    }

    /* 긴급 알림 - 다크 그레이 */
    .alert-danger {
        background-color: #2a2a2a;
        color: #ffffff !important;
        padding: 1.25rem;
        border-radius: 8px;
        border-left: 4px solid #ffffff;
        margin: 1rem 0;
    }

    .alert-danger * {
        color: #ffffff !important;
    }

    .alert-danger div {
        background-color: transparent !important;
        color: #ffffff !important;
    }

    .alert-danger h4,
    .alert-danger strong,
    .alert-danger span,
    .alert-danger p {
        color: #ffffff !important;
    }

    /* 경고 알림 - 미디엄 그레이 */
    .alert-warning {
        background-color: #3a3a3a;
        color: #ffffff !important;
        padding: 1.25rem;
        border-radius: 8px;
        border-left: 4px solid #8a8a8a;
        margin: 1rem 0;
    }

    .alert-warning * {
        color: #ffffff !important;
    }

    .alert-warning h4 {
        color: #ffffff !important;
    }

    .alert-warning strong {
        color: #ffffff !important;
    }

    .alert-warning div {
        background-color: transparent !important;
    }

    /* 성공 알림 - 라이트 그레이 */
    .alert-success {
        background-color: #4a4a4a;
        color: #ffffff !important;
        padding: 1.25rem;
        border-radius: 8px;
        border-left: 4px solid #aaaaaa;
        margin: 1rem 0;
    }

    .alert-success * {
        color: #ffffff !important;
    }

    .alert-success div {
        background-color: transparent !important;
    }

    /* 데이터 테이블 - 다크 */
    .dataframe {
        background-color: #1a1a1a !important;
        border-radius: 8px;
        border: 1px solid #3a3a3a;
    }

    .dataframe thead tr th {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        padding: 0.75rem !important;
    }

    .dataframe tbody tr td {
        color: #e0e0e0 !important;
        padding: 0.5rem !important;
    }

    /* 테이블 헤더 */
    table thead {
        background-color: #2a2a2a !important;
    }

    table thead th {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        font-weight: 700 !important;
    }

    table tbody td {
        color: #e0e0e0 !important;
    }

    /* Streamlit 데이터프레임 스타일 */
    [data-testid="stDataFrame"] {
        background-color: #1a1a1a !important;
    }

    [data-testid="stDataFrame"] * {
        color: #e0e0e0 !important;
    }

    /* Streamlit 최신 데이터프레임 스타일 */
    [data-testid="stDataFrame"] div[role="grid"] {
        background-color: #1a1a1a !important;
    }

    [data-testid="stDataFrame"] div[role="row"] {
        background-color: #1a1a1a !important;
    }

    [data-testid="stDataFrame"] div[role="columnheader"] {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        font-weight: 700 !important;
    }

    [data-testid="stDataFrame"] div[role="gridcell"] {
        background-color: #1a1a1a !important;
        color: #e0e0e0 !important;
    }

    /* 짝수/홀수 행 스타일 - 스트라이프 */
    [data-testid="stDataFrame"] div[role="row"]:nth-child(even) div[role="gridcell"] {
        background-color: #151515 !important;
        color: #e0e0e0 !important;
    }

    [data-testid="stDataFrame"] div[role="row"]:nth-child(odd) div[role="gridcell"] {
        background-color: #1a1a1a !important;
        color: #e0e0e0 !important;
    }

    /* 버튼 - 그레이 */
    .stButton>button {
        border-radius: 6px;
        font-weight: 600;
        padding: 0.625rem 1.25rem;
        background-color: #3a3a3a !important;
        color: #ffffff !important;
        border: 1px solid #5a5a5a;
    }

    .stButton>button:hover {
        background-color: #4a4a4a !important;
        color: #ffffff !important;
        border-color: #6a6a6a;
    }

    /* Primary 버튼 - 화이트 */
    .stButton>button[kind="primary"] {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #ffffff;
    }

    .stButton>button[kind="primary"]:hover {
        background-color: #e0e0e0 !important;
        color: #000000 !important;
    }

    /* 다운로드 버튼 - 라이트 그레이 */
    .stDownloadButton>button {
        background-color: #4a4a4a !important;
        color: #ffffff !important;
        border-radius: 6px;
        font-weight: 600;
        padding: 0.625rem 1.25rem;
        border: 1px solid #6a6a6a;
    }

    .stDownloadButton>button:hover {
        background-color: #5a5a5a !important;
        color: #ffffff !important;
    }

    /* 탭 - 다크 그레이 */
    .stTabs [data-baseweb="tab-list"] {
        background-color: #1a1a1a;
        border-radius: 6px;
        padding: 0.25rem;
        border: 1px solid #3a3a3a;
    }

    .stTabs [data-baseweb="tab"] {
        color: #8a8a8a !important;
        font-weight: 600;
    }

    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        background-color: #3a3a3a !important;
        color: #ffffff !important;
    }

    /* 사이드바 - 다크 그레이 */
    [data-testid="stSidebar"] {
        background-color: #1a1a1a !important;
        padding-top: 1rem !important;
        overflow-y: auto !important;
        transition: all 0.3s ease !important;
        border-right: 1px solid #3a3a3a;
    }

    [data-testid="stSidebar"] > div:first-child {
        padding-top: 0.5rem !important;
        background-color: #1a1a1a !important;
    }

    /* 사이드바가 접혔을 때 */
    [data-testid="stSidebar"][aria-expanded="false"] {
        display: none !important;
    }

    [data-testid="stSidebar"][aria-expanded="true"] {
        display: block !important;
    }

    /* 사이드바 닫기 버튼 */
    [data-testid="baseButton-header"] {
        color: #ffffff !important;
        background-color: transparent !important;
    }

    [data-testid="baseButton-header"]:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
    }

    [data-testid="stSidebar"] h1,
    [data-testid="stSidebar"] h2,
    [data-testid="stSidebar"] h3,
    [data-testid="stSidebar"] label,
    [data-testid="stSidebar"] p,
    [data-testid="stSidebar"] span,
    [data-testid="stSidebar"] div {
        color: #ffffff !important;
        font-weight: 500 !important;
    }

    [data-testid="stSidebar"] .stMarkdown {
        color: #ffffff !important;
    }

    /* 체크박스 */
    .stCheckbox {
        color: #ffffff !important;
    }

    .stCheckbox label {
        color: #ffffff !important;
        font-weight: 500 !important;
    }

    .stCheckbox span {
        color: #ffffff !important;
    }

    /* 메트릭 */
    [data-testid="stMetricValue"] {
        color: #ffffff !important;
        font-size: 1.5rem !important;
        font-weight: 700 !important;
    }

    [data-testid="stMetricLabel"] {
        color: #e0e0e0 !important;
        font-weight: 600 !important;
    }

    /* 메트릭 컨테이너 배경 */
    [data-testid="metric-container"] {
        background-color: #1a1a1a !important;
        padding: 1rem !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.5) !important;
        border: 1px solid #3a3a3a !important;
    }

    /* 헤더 */
    h1, h2, h3 {
        color: #ffffff !important;
    }

    /* 일반 텍스트 */
    p, span, div, label {
        color: #e0e0e0 !important;
    }

    /* Streamlit 상단 헤더 */
    header {
        background-color: #0a0a0a !important;
        padding: 0 !important;
        margin: 0 !important;
        height: 3rem !important;
        display: flex !important;
        align-items: center !important;
    }

    header * {
        color: #ffffff !important;
    }

    /* 툴바 */
    [data-testid="stToolbar"] {
        background-color: transparent !important;
        display: flex !important;
    }

    /* 사이드바 토글 버튼 - 강제 표시 */
    [data-testid="collapsedControl"] {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        background-color: #3a3a3a !important;
        color: #ffffff !important;
        border-radius: 6px !important;
        padding: 0.75rem !important;
        margin: 0.5rem !important;
        border: 1px solid #5a5a5a !important;
        cursor: pointer !important;
        z-index: 1000 !important;
        position: relative !important;
    }

    [data-testid="collapsedControl"]:hover {
        background-color: #4a4a4a !important;
        border-color: #6a6a6a !important;
    }

    [data-testid="collapsedControl"] svg {
        color: #ffffff !important;
        fill: #ffffff !important;
    }

    /* 사이드바 열기 버튼 강제 표시 */
    button[kind="header"] {
        display: flex !important;
        visibility: visible !important;
        background-color: #3a3a3a !important;
        color: #ffffff !important;
        border-radius: 6px !important;
        border: 1px solid #5a5a5a !important;
    }

    button[kind="header"]:hover {
        background-color: #4a4a4a !important;
    }

    /* 상단 바 제거 */
    [data-testid="stHeader"] {
        background-color: #0a0a0a !important;
        padding: 0.5rem !important;
        margin: 0 !important;
        visibility: visible !important;
        height: auto !important;
    }

    /* 앱 상단 여백 제거 */
    [data-testid="stAppViewContainer"] {
        padding-top: 0 !important;
        margin-top: 0 !important;
    }

    /* 데코레이션 제거 */
    [data-testid="stDecoration"] {
        display: none !important;
    }

    /* 상단 여백 완전 제거 */
    .main > div:first-child {
        padding-top: 0 !important;
    }

    /* 입력 필드 - 다크 */
    input, select, textarea {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        border: 2px solid #4a4a4a !important;
        font-weight: 600 !important;
    }

    input:focus, select:focus, textarea:focus {
        border-color: #8a8a8a !important;
        outline: none !important;
    }

    /* Number input */
    [data-testid="stNumberInput"] input {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        font-size: 1rem !important;
    }

    /* Selectbox - 드롭다운 */
    [data-testid="stSelectbox"] {
        background-color: #2a2a2a !important;
    }

    [data-testid="stSelectbox"] > div > div {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
    }

    [data-testid="stSelectbox"] select {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        font-weight: 600 !important;
    }

    [data-testid="stSelectbox"] label {
        color: #ffffff !important;
        font-weight: 600 !important;
    }

    /* 드롭다운 메뉴 */
    [data-baseweb="popover"] {
        background-color: #2a2a2a !important;
    }

    [data-baseweb="menu"] {
        background-color: #2a2a2a !important;
    }

    [data-baseweb="menu"] li {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
    }

    [data-baseweb="menu"] li:hover {
        background-color: #3a3a3a !important;
        color: #ffffff !important;
    }

    /* 슬라이더 라벨 */
    [data-testid="stSlider"] label {
        color: #ffffff !important;
        font-weight: 600 !important;
    }

    [data-testid="stSlider"] div {
        color: #ffffff !important;
    }

    /* 체크박스 스타일 - 검정 배경에서도 잘 보이게 */
    [data-testid="stCheckbox"] {
        background-color: transparent !important;
    }

    [data-testid="stCheckbox"] label {
        color: #ffffff !important;
        font-weight: 600 !important;
    }

    /* 체크박스 자체 */
    [data-testid="stCheckbox"] input[type="checkbox"] {
        background-color: #2a2a2a !important;
        border: 2px solid #5a5a5a !important;
        width: 20px !important;
        height: 20px !important;
    }

    [data-testid="stCheckbox"] input[type="checkbox"]:checked {
        background-color: #8a8a8a !important;
        border-color: #aaaaaa !important;
    }

    /* 체크 표시 아이콘 - 더 강력하게 */
    [data-testid="stCheckbox"] svg {
        fill: #ffffff !important;
        stroke: #ffffff !important;
        color: #ffffff !important;
    }

    [data-testid="stCheckbox"] input[type="checkbox"]:checked + div svg {
        fill: #ffffff !important;
        stroke: #ffffff !important;
        color: #ffffff !important;
    }

    /* 체크박스 체크 마크 */
    [data-testid="stCheckbox"] input[type="checkbox"]:checked::after {
        color: #ffffff !important;
        background-color: #8a8a8a !important;
    }

    /* Streamlit 기본 체크박스 스타일 강제 덮어쓰기 */
    .st-emotion-cache-* [data-testid="stCheckbox"] input[type="checkbox"]:checked {
        background-color: #8a8a8a !important;
        background-image: none !important;
    }

    /* 경고 박스 안의 텍스트 */
    .alert-warning div div {
        color: #ffffff !important;
    }

    /* 사이드바 토글 버튼 - 명확하게 보이도록 */
    [data-testid="collapsedControl"] {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        border: 2px solid #5a5a5a !important;
        border-radius: 8px !important;
        padding: 0.75rem !important;
        cursor: pointer !important;
        position: fixed !important;
        left: 1rem !important;
        top: 1rem !important;
        z-index: 999999 !important;
        width: 3rem !important;
        height: 3rem !important;
        align-items: center !important;
        justify-content: center !important;
    }

    [data-testid="collapsedControl"]:hover {
        background-color: #3a3a3a !important;
        transform: scale(1.1) !important;
    }

    [data-testid="collapsedControl"] svg {
        fill: #ffffff !important;
        width: 1.5rem !important;
        height: 1.5rem !important;
    }

    /* 사이드바 자체 */
    [data-testid="stSidebar"] {
        background-color: #1a1a1a !important;
    }

    [data-testid="stSidebar"] > div:first-child {
        background-color: #1a1a1a !important;
    }

    /* 사이드바 헤더 */
    [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] {
        color: #ffffff !important;
    }

    /* Expander (접기/펼치기) 스타일 - 모노크롬 */
    [data-testid="stExpander"] {
        background-color: #1a1a1a !important;
        border: 1px solid #3a3a3a !important;
        border-radius: 8px !important;
    }

    [data-testid="stExpander"] summary {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        padding: 0.75rem !important;
        border-radius: 6px !important;
        font-weight: 600 !important;
    }

    [data-testid="stExpander"] summary:hover {
        background-color: #3a3a3a !important;
    }

    [data-testid="stExpander"] summary * {
        color: #ffffff !important;
    }

    [data-testid="stExpander"] details[open] summary {
        border-bottom: 1px solid #3a3a3a !important;
        border-radius: 6px 6px 0 0 !important;
    }

    /* Expander 내부 컨텐츠 */
    [data-testid="stExpander"] > div > div {
        background-color: #1a1a1a !important;
        padding: 1rem !important;
    }

    /* Expander 추가 스타일 - 모든 가능한 선택자 */
    details summary {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
        padding: 0.75rem !important;
        border-radius: 6px !important;
        font-weight: 600 !important;
    }

    details summary span {
        color: #ffffff !important;
    }

    details summary p {
        color: #ffffff !important;
    }

    details summary div {
        color: #ffffff !important;
    }

    /* Streamlit expander 특정 */
    .streamlit-expanderHeader {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
    }

    .streamlit-expanderHeader * {
        color: #ffffff !important;
    }

    /* 모든 details/summary 요소 */
    details[open] > summary {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
    }

    details:not([open]) > summary {
        background-color: #2a2a2a !important;
        color: #ffffff !important;
    }
</style>
""", unsafe_allow_html=True)

# 발주 이력 및 선택 초기화
if 'order_history' not in st.session_state:
    st.session_state.order_history = {}

if 'selected_items' not in st.session_state:
    st.session_state.selected_items = set()

if 'custom_quantities' not in st.session_state:
    st.session_state.custom_quantities = {}

# 데이터 로딩 함수
@st.cache_data
def load_psi_data(file_path):
    """PSI 엑셀 파일 로딩"""
    if not os.path.exists(file_path):
        st.error(f"❌ PSI 파일을 찾을 수 없습니다: {file_path}")
        return None, None, None, None, None

    wb = openpyxl.load_workbook(file_path, data_only=True)

    # 대시보드 데이터
    ws_dashboard = wb['대시보드']
    dashboard_data = {
        'total_sku': ws_dashboard.cell(6, 3).value,
        'total_value': ws_dashboard.cell(7, 3).value,
        'avg_turnover_days': ws_dashboard.cell(8, 3).value,
        'shortage': ws_dashboard.cell(9, 3).value,
        'reorder': ws_dashboard.cell(10, 3).value,
    }

    # 재고분석 데이터
    ws_inventory = wb['재고분석']
    inventory_data = []
    for row in range(2, min(ws_inventory.max_row + 1, 410)):
        sku = ws_inventory.cell(row, 3).value
        if sku:
            inventory_data.append({
                '구분': ws_inventory.cell(row, 2).value or '정상',
                'SKU코드': sku,
                '제품명': ws_inventory.cell(row, 4).value,
                '카테고리': ws_inventory.cell(row, 5).value,
                'ABC등급': ws_inventory.cell(row, 6).value,
                'XYZ등급': ws_inventory.cell(row, 7).value,
                '현재고': ws_inventory.cell(row, 8).value or 0,
                '안전재고': ws_inventory.cell(row, 9).value or 0,
                '최근3개월평균': ws_inventory.cell(row, 11).value or 0,
            })

    df_inventory = pd.DataFrame(inventory_data)

    # 안전재고 데이터
    ws_safety = wb['안전재고']
    safety_data = []
    for row in range(2, min(ws_safety.max_row + 1, 410)):
        sku = ws_safety.cell(row, 1).value
        if sku:
            safety_data.append({
                'SKU코드': sku,
                '제품명': ws_safety.cell(row, 2).value,
                '리드타임': ws_safety.cell(row, 3).value or 30,
                '일평균판매': ws_safety.cell(row, 4).value or 0,
                '수요표준편차': ws_safety.cell(row, 5).value or 0,
                'ABC': ws_safety.cell(row, 6).value,
                'XYZ': ws_safety.cell(row, 7).value,
                '안전재고': ws_safety.cell(row, 9).value or 0,
            })

    df_safety = pd.DataFrame(safety_data)

    # ABC-XYZ 데이터 (월별 출고 포함)
    ws_abc = wb['ABC-XYZ분석 (2)']
    abc_data = []
    for row in range(2, min(ws_abc.max_row + 1, 410)):
        sku = ws_abc.cell(row, 3).value  # 컬럼 3: SKU#
        if sku:
            row_data = {
                'SKU코드': sku,
                '제품명': ws_abc.cell(row, 7).value,     # 컬럼 7: 제품명
                '연간판매': ws_abc.cell(row, 22).value or 0,  # 컬럼 22: 연간 판매
                '매입원가': ws_abc.cell(row, 24).value or 0,  # 컬럼 24: 평균 판매단가
                '연간COGS': ws_abc.cell(row, 26).value or 0,  # 컬럼 26: 25년 연간 판매금액
                'ABC등급': ws_abc.cell(row, 29).value,   # 컬럼 29: ABC등급
            }

            # 월별 출고 데이터 (컬럼 10-21: 1월~12월)
            for month_idx in range(1, 13):
                col_idx = 9 + month_idx  # 10-21 컬럼
                month_value = ws_abc.cell(row, col_idx).value or 0
                row_data[f'{month_idx}월출고'] = month_value

            abc_data.append(row_data)

    df_abc = pd.DataFrame(abc_data)

    # PSI 메인 데이터
    ws_psi = wb['PSI_메인']
    psi_data = []
    for row in range(4, min(ws_psi.max_row + 1, 412)):
        sku = ws_psi.cell(row, 1).value
        if sku:
            psi_data.append({
                'SKU코드': sku,
                '제품명': ws_psi.cell(row, 2).value,
                '카테고리': ws_psi.cell(row, 3).value,
                '계절': ws_psi.cell(row, 4).value,
                'ABC등급': ws_psi.cell(row, 5).value,
                'XYZ등급': ws_psi.cell(row, 6).value,
                '기초재고': ws_psi.cell(row, 7).value or 0,
            })

    df_psi = pd.DataFrame(psi_data)

    # SKU코드를 모두 문자열로 통일 (데이터 타입 충돌 방지)
    if 'SKU코드' in df_inventory.columns:
        df_inventory['SKU코드'] = df_inventory['SKU코드'].astype(str)
    if 'SKU코드' in df_safety.columns:
        df_safety['SKU코드'] = df_safety['SKU코드'].astype(str)
    if 'SKU코드' in df_abc.columns:
        df_abc['SKU코드'] = df_abc['SKU코드'].astype(str)
    if 'SKU코드' in df_psi.columns:
        df_psi['SKU코드'] = df_psi['SKU코드'].astype(str)

    # 모든 숫자 컬럼을 숫자 타입으로 변환 (데이터 타입 에러 방지)
    numeric_cols_inventory = ['현재고', '안전재고', '발주점']
    for col in numeric_cols_inventory:
        if col in df_inventory.columns:
            df_inventory[col] = pd.to_numeric(df_inventory[col], errors='coerce').fillna(0)

    numeric_cols_safety = ['일평균판매', '리드타임', '안전재고']
    for col in numeric_cols_safety:
        if col in df_safety.columns:
            df_safety[col] = pd.to_numeric(df_safety[col], errors='coerce').fillna(0)

    numeric_cols_abc = ['연간COGS', '연간판매', '비중%']
    for col in numeric_cols_abc:
        if col in df_abc.columns:
            df_abc[col] = pd.to_numeric(df_abc[col], errors='coerce').fillna(0)

    numeric_cols_psi = ['판매', '입고', '기초재고']
    for col in numeric_cols_psi:
        if col in df_psi.columns:
            df_psi[col] = pd.to_numeric(df_psi[col], errors='coerce').fillna(0)

    return dashboard_data, df_inventory, df_safety, df_abc, df_psi

# 발주 필요 분석 함수
def analyze_procurement_needs(df_inventory, df_safety):
    """발주 필요 SKU 분석"""
    # 데이터 병합
    df = pd.merge(df_inventory, df_safety[['SKU코드', '일평균판매', '리드타임']], on='SKU코드', how='left')

    # 빈 값 처리 및 타입 변환
    df['일평균판매'] = pd.to_numeric(df['일평균판매'], errors='coerce').fillna(0)
    df['리드타임'] = pd.to_numeric(df['리드타임'], errors='coerce').fillna(30)
    df['안전재고'] = pd.to_numeric(df['안전재고'], errors='coerce').fillna(0)
    df['현재고'] = pd.to_numeric(df['현재고'], errors='coerce').fillna(0)

    # 발주점 계산 (ROP = 일평균판매 × 리드타임 + 안전재고)
    df['발주점'] = (df['일평균판매'] * df['리드타임']) + df['안전재고']

    # 발주 필요 여부
    df['발주필요'] = df['현재고'] <= df['발주점']

    # 재고 상태
    def get_status(row):
        if row['안전재고'] == 0:
            return '안전재고 미설정'
        ratio = row['현재고'] / row['안전재고']
        if ratio < 1.0:
            return '🔴 부족'
        elif ratio < 1.5:
            return '🟡 재주문 필요'
        elif ratio <= 2.0:
            return '🟢 적정'
        else:
            return '🔵 과잉'

    df['재고상태'] = df.apply(get_status, axis=1)

    # 권장 발주량 계산
    def calc_order_qty(row):
        try:
            # 발주 불필요하면 0
            if not row['발주필요']:
                return 0

            # 일평균판매가 없으면 0
            if row['일평균판매'] <= 0:
                return 0

            # 부족분 계산 (발주점 - 현재고)
            shortage = row['발주점'] - row['현재고']

            # 현재고가 발주점보다 많으면 발주 불필요
            if shortage <= 0:
                return 0

            # 기본: 부족분 + 1주 판매량 (안전 마진)
            weekly_sales = float(row['일평균판매']) * 7
            base_qty = shortage + weekly_sales

            # 안전재고 자체가 이미 ABC/XYZ 보정이 적용된 값이므로
            # 추가 보정 없이 기본 발주량만 계산
            # (안전재고 → 발주점 → shortage 계산 시 이미 반영됨)

            return max(0, int(base_qty))
        except Exception as e:
            # 디버깅용: 에러 무시하지 말고 0 반환
            return 0

    df['권장발주량'] = df.apply(calc_order_qty, axis=1)

    # ===== 추가 기능: 재고 충분도 분석 =====
    # 재고 소진 예상일 계산
    df['재고소진일'] = df.apply(
        lambda row: int(row['현재고'] / row['일평균판매']) if row['일평균판매'] > 0 else 999,
        axis=1
    )

    # 충분도 상태
    def get_coverage_status(days):
        if days <= 7:
            return '🔴 위험 (7일 이하)'
        elif days <= 14:
            return '🟡 주의 (14일 이하)'
        elif days <= 30:
            return '🟢 양호 (30일 이하)'
        elif days < 999:
            return '🔵 과다 (30일 초과)'
        else:
            return '⚪ 판매없음'

    df['충분도상태'] = df['재고소진일'].apply(get_coverage_status)

    # 리드타임 대비 안전도 (재고일 / 리드타임)
    df['리드타임대비'] = df.apply(
        lambda row: round(row['재고소진일'] / row['리드타임'], 1) if row['리드타임'] > 0 else 0,
        axis=1
    )

    # 발주 필요 여부 재계산 (재고 소진일 고려)
    # 재고가 30일 이상 있으면 발주 불필요로 변경
    df['발주필요'] = df.apply(
        lambda row: row['발주필요'] and row['재고소진일'] < 30,
        axis=1
    )

    return df

# 메인 앱
def main():
    # 헤더
    st.markdown('<div class="main-header">📦 스마트 발주 시스템</div>', unsafe_allow_html=True)
    st.markdown(f"**분석 기준일**: {datetime.now().strftime('%Y년 %m월 %d일')}")

    # 사이드바 - 파일 선택
    st.sidebar.header("📁 파일 선택")

    file_option = st.sidebar.radio(
        "데이터 소스:",
        ["기본 파일", "파일 업로드", "경로 입력"],
        label_visibility="collapsed"
    )

    excel_file = None

    if file_option == "기본 파일":
        excel_file = "PSI_260205_신규.xlsx"
        st.sidebar.success("✅ 기본 파일 사용 중")

    elif file_option == "파일 업로드":
        uploaded_file = st.sidebar.file_uploader(
            "PSI 엑셀 파일 업로드",
            type=['xlsx'],
            help="PSI_최종완성.xlsx 형식의 파일"
        )
        if uploaded_file:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
                tmp_file.write(uploaded_file.getvalue())
                excel_file = tmp_file.name
            st.sidebar.success(f"✅ {uploaded_file.name}")
        else:
            st.sidebar.info("파일을 업로드하세요")

    elif file_option == "경로 입력":
        custom_path = st.sidebar.text_input(
            "파일 경로:",
            value="PSI_260205_신규.xlsx",
            help="예: C:/data/PSI.xlsx"
        )
        if custom_path:
            if os.path.exists(custom_path):
                excel_file = custom_path
                st.sidebar.success(f"✅ 파일 찾음")
            else:
                st.sidebar.error("❌ 파일 없음")

    # 데이터 로딩
    if excel_file:
        with st.spinner('PSI 데이터 로딩 중...'):
            dashboard_data, df_inventory, df_safety, df_abc, df_psi = load_psi_data(excel_file)
    else:
        dashboard_data, df_inventory, df_safety, df_abc, df_psi = None, None, None, None, None

    if dashboard_data is None:
        st.stop()

    st.sidebar.markdown("---")

    # 발주 분석
    df_analysis = analyze_procurement_needs(df_inventory, df_safety)

    # 사이드바 - 필터
    st.sidebar.header("🔍 필터")

    # ABC 필터
    abc_filter = st.sidebar.multiselect(
        "ABC 등급",
        options=['A', 'B', 'C'],
        default=['A', 'B', 'C']
    )

    # 상태 필터
    status_filter = st.sidebar.multiselect(
        "재고 상태",
        options=['🔴 부족', '🟡 재주문 필요', '🟢 적정', '🔵 과잉'],
        default=['🔴 부족', '🟡 재주문 필요']
    )

    # 필터 적용
    df_filtered = df_analysis[
        (df_analysis['ABC등급'].isin(abc_filter)) &
        (df_analysis['재고상태'].isin(status_filter))
    ]

    # 탭 구성
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(["📊 대시보드", "📦 발주 관리", "🎯 KPI 관리", "📋 발주 현황", "📈 분석", "⚙️ 설정"])

    with tab1:
        show_dashboard(dashboard_data, df_analysis)

    with tab2:
        show_procurement(df_filtered)

    with tab3:
        show_kpi_management(df_analysis, df_psi, df_abc)

    with tab4:
        show_order_status(df_analysis)

    with tab5:
        show_analysis(df_analysis, df_abc)

    with tab6:
        show_settings()

def show_dashboard(dashboard_data, df_analysis):
    """대시보드 화면"""

    # 헤더 - 깔끔한 회색 톤
    st.markdown("""
        <div style='background: #ffffff; padding: 1.5rem; border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; border: 1px solid #e2e8f0;'>
            <h2 style='color: #0f172a; margin: 0; font-size: 1.75rem; font-weight: 700;'>
                📊 재고 현황 대시보드
            </h2>
            <p style='color: #64748b; margin-top: 0.5rem; font-size: 0.95rem;'>
                실시간 재고 모니터링 및 스마트 발주 인사이트
            </p>
        </div>
    """, unsafe_allow_html=True)

    # 주요 지표 - 카드 스타일
    col1, col2, col3, col4, col5 = st.columns(5, gap="medium")

    with col1:
        st.metric(
            label="총 SKU",
            value=f"{dashboard_data['total_sku']:,}개",
            delta=None
        )

    with col2:
        st.metric(
            label="총 재고금액",
            value=f"{dashboard_data['total_value']/100000000:.1f}억원",
            delta=None
        )

    with col3:
        # 평균 재고 소진일 (신규 추가)
        avg_coverage = df_analysis[df_analysis['재고소진일'] < 999]['재고소진일'].mean()
        st.metric(
            label="📅 평균 재고일",
            value=f"{avg_coverage:.0f}일",
            delta="충분" if avg_coverage >= 14 else "부족",
            delta_color="normal" if avg_coverage >= 14 else "inverse"
        )

    with col4:
        # 재고 위험 제품 수 (신규 추가)
        risk_count = len(df_analysis[df_analysis['충분도상태'].str.contains('위험', na=False)])
        st.metric(
            label="🔴 재고 위험",
            value=f"{risk_count}개",
            delta="긴급 발주",
            delta_color="inverse" if risk_count > 0 else "normal"
        )

    with col5:
        turnover_rate = 365 / dashboard_data['avg_turnover_days']
        st.metric(
            label="재고회전율",
            value=f"{turnover_rate:.2f}회/년",
            delta=f"목표 4회" if turnover_rate < 4 else "양호",
            delta_color="normal" if turnover_rate >= 4 else "inverse"
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # 긴급 조치 필요
    st.markdown("""
        <div style='background: #ffffff; padding: 1.25rem; border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border: 1px solid #e2e8f0;'>
            <h3 style='color: #dc2626; margin: 0; font-size: 1.25rem; font-weight: 700;'>
                🚨 긴급 조치 필요
            </h3>
        </div>
    """, unsafe_allow_html=True)

    urgent = df_analysis[df_analysis['재고상태'] == '🔴 부족'].sort_values('현재고', ascending=True).head(10)

    if len(urgent) > 0:
        for idx, row in urgent.iterrows():
            coverage_text = f"{row['재고소진일']}일치 재고" if row['재고소진일'] < 999 else "판매없음"

            # 순수 Streamlit 컴포넌트로 표시 (HTML 제거)
            sku_code = row['SKU코드']

            # 긴급 알림
            st.error(f"**⚠️ 즉시 발주 필요: {row['SKU코드']}**")
            st.write(f"**제품명**: {row['제품명']}")

            # 재고 정보
            urgent_col1, urgent_col2, urgent_col3 = st.columns(3)
            with urgent_col1:
                st.write(f"📦 현재고: **{row['현재고']:,.0f}개**")
            with urgent_col2:
                st.write(f"🛡️ 안전재고: **{row['안전재고']:,.0f}개**")
            with urgent_col3:
                st.write(f"📅 재고: **{coverage_text}**")

            # 최근 발주 정보
            last_order = st.session_state.order_history.get(sku_code, None)
            if last_order:
                days_ago = (datetime.now() - last_order['timestamp']).days
                st.caption(f"📋 최근발주: {last_order['quantity']:,.0f}개 ({days_ago}일 전)")
    else:
        st.markdown("""
            <div class="alert-success">
                <h4 style='margin: 0; font-size: 1.05rem; color: #ffffff; font-weight: 600;'>✅ 긴급 조치 필요한 품목이 없습니다</h4>
                <p style='margin: 0.375rem 0 0 0; color: #d1fae5; font-size: 0.9rem;'>모든 재고가 안전 수준을 유지하고 있습니다.</p>
            </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # 발주 대기
    st.markdown("""
        <div style='background: #ffffff; padding: 1.25rem; border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border: 1px solid #e2e8f0;'>
            <h3 style='color: #f59e0b; margin: 0; font-size: 1.25rem; font-weight: 700;'>
                📦 발주 필요 품목
            </h3>
        </div>
    """, unsafe_allow_html=True)

    # 실제로 발주가 필요한 품목만 (권장발주량 > 0)
    reorder = df_analysis[
        (df_analysis['발주필요'] == True) &
        (df_analysis['권장발주량'] > 0)
    ].sort_values('재고소진일', ascending=True).head(10)

    if len(reorder) > 0:
        # 전체 선택/해제
        col_select, col_clear, col_action = st.columns([1, 1, 3])
        with col_select:
            # 전체 선택 버튼
            if st.button("전체 선택", key="select_all_dashboard"):
                all_skus = set(reorder['SKU코드'].tolist())
                st.session_state.selected_items = all_skus
                # 전체 선택 플래그 설정 (체크박스 상태는 value로 자동 반영)
                st.session_state.just_selected_all_dash = True
                st.rerun()

        with col_clear:
            if st.button("선택 해제", key="deselect_all"):
                st.session_state.selected_items = set()
                # 전체 해제 플래그 설정 (체크박스 상태는 value로 자동 반영)
                st.session_state.just_cleared_all_dash = True
                st.rerun()

        with col_action:
            selected_count = len(st.session_state.selected_items)
            if selected_count > 0:
                st.info(f"📦 선택된 품목: {selected_count}개")

        st.markdown("<br>", unsafe_allow_html=True)

        for idx, row in reorder.iterrows():
            col_check, col_content, col_qty, col_btn = st.columns([0.3, 2.7, 1, 1])

            with col_check:
                sku_code = row['SKU코드']
                is_checked = sku_code in st.session_state.selected_items
                checked = st.checkbox("", value=is_checked, key=f"check_{sku_code}_{idx}", label_visibility="collapsed")

                # 전체 선택/해제 직후에는 개별 체크박스 로직 실행 안 함
                skip_logic_dash = st.session_state.get('just_selected_all_dash', False) or st.session_state.get('just_cleared_all_dash', False)

                if not skip_logic_dash:
                    if checked and sku_code not in st.session_state.selected_items:
                        st.session_state.selected_items.add(sku_code)
                    elif not checked and sku_code in st.session_state.selected_items:
                        st.session_state.selected_items.remove(sku_code)

            with col_content:
                coverage_text = f"{row['재고소진일']}일치" if row['재고소진일'] < 999 else "충분"

                # 순수 Streamlit 컴포넌트로 표시 (HTML 제거)
                st.warning(f"**{row['SKU코드']} - {row['제품명']}**")

                # 발주 이력 확인
                sku_code = row['SKU코드']
                info_col1, info_col2, info_col3, info_col4 = st.columns(4)

                with info_col1:
                    st.write(f"📦 현재고: **{row['현재고']:,.0f}개**")
                with info_col2:
                    st.write(f"🛡️ 안전재고: **{row['안전재고']:,.0f}개**")
                with info_col3:
                    st.write(f"📅 {coverage_text}")
                with info_col4:
                    st.write(f"📋 권장: **{row['권장발주량']:,.0f}개**")

                # 최근 발주 정보
                last_order = st.session_state.order_history.get(sku_code, None)
                if last_order:
                    days_ago = (datetime.now() - last_order['timestamp']).days
                    st.caption(f"📋 최근발주: {last_order['quantity']:,.0f}개 ({days_ago}일 전)")

            with col_qty:
                # 발주 수량 입력
                default_qty = int(row['권장발주량'])
                if sku_code not in st.session_state.custom_quantities:
                    st.session_state.custom_quantities[sku_code] = default_qty

                qty = st.number_input(
                    "발주량",
                    min_value=1,
                    value=st.session_state.custom_quantities.get(sku_code, default_qty),
                    step=10,
                    key=f"qty_{sku_code}_{idx}",
                    label_visibility="collapsed"
                )
                st.session_state.custom_quantities[sku_code] = qty

            with col_btn:
                if st.button("📤 발주", key=f"order_{idx}", use_container_width=True):
                    # 발주 이력 저장 (사용자 입력 수량 사용)
                    order_qty = st.session_state.custom_quantities.get(sku_code, int(row['권장발주량']))
                    st.session_state.order_history[sku_code] = {
                        'quantity': order_qty,
                        'timestamp': datetime.now(),
                        'product_name': row['제품명']
                    }
                    st.success(f"✅ {sku_code} - {order_qty:,}개 발주 요청됨")
                    st.rerun()

        # 전체 선택/해제 플래그 초기화
        if 'just_selected_all_dash' in st.session_state:
            st.session_state.just_selected_all_dash = False
        if 'just_cleared_all_dash' in st.session_state:
            st.session_state.just_cleared_all_dash = False

        # 일괄 발주 버튼
        if len(st.session_state.selected_items) > 0:
            st.markdown("<br>", unsafe_allow_html=True)
            col1, col2, col3 = st.columns([1, 1, 2])

            with col1:
                if st.button(f"✅ 선택 품목 일괄 발주 ({len(st.session_state.selected_items)}개)", type="primary", use_container_width=True):
                    # 선택된 품목 발주 (사용자 입력 수량 사용)
                    total_qty = 0
                    for sku in st.session_state.selected_items:
                        matching_row = reorder[reorder['SKU코드'] == sku]
                        if len(matching_row) > 0:
                            row_data = matching_row.iloc[0]
                            # 사용자가 입력한 수량 사용, 없으면 권장 발주량
                            order_qty = st.session_state.custom_quantities.get(sku, int(row_data['권장발주량']))
                            st.session_state.order_history[sku] = {
                                'quantity': order_qty,
                                'timestamp': datetime.now(),
                                'product_name': row_data['제품명']
                            }
                            total_qty += order_qty

                    st.success(f"✅ {len(st.session_state.selected_items)}개 품목 발주 완료! (총 {total_qty:,}개)")
                    st.session_state.selected_items = set()
                    st.rerun()

            with col2:
                # Excel 발주서 다운로드
                from io import BytesIO
                import openpyxl
                from openpyxl.styles import Font, Alignment, PatternFill

                wb = openpyxl.Workbook()
                ws = wb.active
                ws.title = "발주서"

                # 헤더
                ws['A1'] = '발주서'
                ws['A1'].font = Font(size=18, bold=True)
                ws['A2'] = f'발주일: {datetime.now().strftime("%Y-%m-%d %H:%M")}'

                # 컬럼 헤더
                headers = ['No', 'SKU코드', '제품명', '현재고', '안전재고', '발주량', '권장발주량']
                for col_idx, header in enumerate(headers, start=1):
                    cell = ws.cell(row=4, column=col_idx, value=header)
                    cell.font = Font(bold=True)
                    cell.fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")

                # 데이터
                row_num = 5
                for sku in st.session_state.selected_items:
                    matching_row = reorder[reorder['SKU코드'] == sku]
                    if len(matching_row) > 0:
                        row_data = matching_row.iloc[0]
                        order_qty = st.session_state.custom_quantities.get(sku, int(row_data['권장발주량']))
                        ws.cell(row=row_num, column=1, value=row_num-4)
                        ws.cell(row=row_num, column=2, value=sku)
                        ws.cell(row=row_num, column=3, value=row_data['제품명'])
                        ws.cell(row=row_num, column=4, value=int(row_data['현재고']))
                        ws.cell(row=row_num, column=5, value=int(row_data['안전재고']))
                        ws.cell(row=row_num, column=6, value=order_qty)
                        ws.cell(row=row_num, column=7, value=int(row_data['권장발주량']))
                        row_num += 1

                buffer = BytesIO()
                wb.save(buffer)
                buffer.seek(0)

                st.download_button(
                    label=f"📥 발주서 다운로드",
                    data=buffer,
                    file_name=f"발주서_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    use_container_width=True
                )
    else:
        st.markdown("""
            <div class="alert-success">
                <h4 style='margin: 0; font-size: 1.05rem; color: #ffffff; font-weight: 600;'>✅ 재주문 필요한 품목이 없습니다</h4>
                <p style='margin: 0.375rem 0 0 0; color: #d1fae5; font-size: 0.9rem;'>현재 모든 재고가 적정 수준입니다.</p>
            </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # 재고 상태 분포
    st.markdown("""
        <div style='background: #ffffff; padding: 1.25rem; border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border: 1px solid #e2e8f0;'>
            <h3 style='color: #0f172a; margin: 0; font-size: 1.25rem; font-weight: 700;'>
                📊 재고 상태 분포
            </h3>
        </div>
    """, unsafe_allow_html=True)

    status_count = df_analysis['재고상태'].value_counts()

    # 전문적인 컬러 팔레트 (회색 계열)
    status_colors = ['#dc2626', '#f59e0b', '#059669', '#475569']

    fig = go.Figure(data=[go.Pie(
        labels=status_count.index,
        values=status_count.values,
        hole=.4,
        marker=dict(
            colors=status_colors,
            line=dict(color='white', width=3)
        ),
        textfont=dict(size=14, color='white', family='Arial Black'),
        pull=[0.1, 0, 0, 0]  # 첫 번째 항목 살짝 분리
    )])

    fig.update_layout(
        title=dict(
            text="재고 상태 분포",
            font=dict(size=16, color='#ffffff', family='Arial')
        ),
        showlegend=True,
        height=400,
        paper_bgcolor='#0a0a0a',
        plot_bgcolor='#0a0a0a',
        font=dict(family='Arial, sans-serif', size=11, color='#e0e0e0')
    )

    st.plotly_chart(fig, use_container_width=True)

def show_procurement(df_filtered):
    """발주 관리 화면"""
    st.header("📦 스마트 발주 관리")

    # 발주 기준 설명 및 데이터 정보
    with st.expander("📋 발주 기준 및 계산 방식", expanded=False):
        col1, col2 = st.columns(2)

        with col1:
            st.markdown("""
            ### 🎯 발주 기준

            **발주 필요 판단**:
            - 현재고 ≤ 발주점
            - AND 재고소진일 < 30일

            **발주점 계산**:
            ```
            발주점 = (일평균판매 × 리드타임) + 안전재고
            ```
            ⚠️ **안전재고는 ABC/XYZ 등급에 따른 보정이 이미 적용된 값입니다**
            - ABC등급: 매출 기여도 (A > B > C)
            - XYZ등급: 수요 변동성 및 계절성 (Z = 높은 변동성)

            **권장 발주량**:
            ```
            발주량 = (발주점 - 현재고) + 1주 판매량
            ```
            부족분 + 안전 마진(1주치)
            """)

        with col2:
            st.markdown("""
            ### 📊 데이터 정보

            **PSI 엑셀 파일에서 자동 계산**:
            - 안전재고 (ABC/XYZ 보정 적용됨)
            - 발주점 (리드타임 + 안전재고)
            - 일평균판매 (최근 30일 기준)
            - 재고소진일

            **ABC/XYZ 분석**:
            - ABC: 연간 매출 기여도 (파레토 법칙)
            - XYZ: 수요 변동계수 (표준편차/평균)
            - Z등급은 계절성 상품 포함

            **업데이트 방법**:
            1. 좌측 사이드바에서 파일 업로드
            2. 또는 경로 입력으로 자동 로드
            3. 일별/주별 업데이트 권장
            """)

        st.info("💡 **팁**: 발주량은 권장사항입니다. 실제 시장 상황, 프로모션 계획 등을 고려하여 조정하세요.")

        st.success("""
        ✅ **중요**: 안전재고는 PSI 엑셀 파일에서 이미 ABC/XYZ 등급별 보정계수가 적용되어 있습니다.
        - A등급/X등급: 높은 서비스 레벨 (안전재고 ↑)
        - Z등급: 계절성/변동성 반영 (안전재고 ↑)
        - C등급: 낮은 우선순위 (안전재고 ↓)
        """)

    st.markdown("---")

    # 발주 필요 품목 (권장발주량이 0보다 큰 것만)
    need_order = df_filtered[
        (df_filtered['발주필요'] == True) &
        (df_filtered['권장발주량'] > 0)
    ].sort_values('현재고', ascending=True)

    st.subheader(f"발주 필요 품목: {len(need_order)}개")

    if len(need_order) > 0:
        # Fragment 함수 정의 - 전체 선택/해제 버튼을 Fragment로 감싸서 스크롤 방지
        @st.fragment
        def render_select_buttons(need_order_df):
            # 전체 선택/해제
            col_select, col_clear = st.columns([1, 4])
            with col_select:
                # 전체 선택 버튼
                if st.button("전체 선택", key="select_all_reorder_tab"):
                    all_skus = set(need_order_df['SKU코드'].tolist())
                    st.session_state.selected_items = all_skus
                    # 전체 선택 플래그 설정
                    st.session_state.just_selected_all = True
                    # 체크박스 상태 업데이트 (각 체크박스 키에 맞게)
                    for enum_idx, (idx, row) in enumerate(need_order_df.iterrows()):
                        sku_code = row['SKU코드']
                        checkbox_key = f"sel_reorder_{sku_code}_{enum_idx}"
                        # 기존 키가 있으면 업데이트
                        if checkbox_key in st.session_state:
                            st.session_state[checkbox_key] = True
                    st.rerun()  # 전체 페이지 rerun으로 변경 (하단 발주 버튼 표시용)

            with col_clear:
                if st.button("선택 해제", key="clear_all_reorder_tab"):
                    st.session_state.selected_items = set()
                    # 전체 해제 플래그 설정
                    st.session_state.just_cleared_all = True
                    # 체크박스 상태 업데이트 (각 체크박스 키에 맞게)
                    for enum_idx, (idx, row) in enumerate(need_order_df.iterrows()):
                        sku_code = row['SKU코드']
                        checkbox_key = f"sel_reorder_{sku_code}_{enum_idx}"
                        # 기존 키가 있으면 업데이트
                        if checkbox_key in st.session_state:
                            st.session_state[checkbox_key] = False
                    st.rerun()  # 전체 페이지 rerun으로 변경 (하단 발주 버튼 숨김용)

            # 선택된 품목 수 표시
            selected_count = len(st.session_state.selected_items)
            if selected_count > 0:
                st.info(f"📦 선택된 품목: {selected_count}개")

        # 버튼 렌더링
        render_select_buttons(need_order)

        # Fragment 함수 정의 - 발주량 입력 부분만 rerun
        @st.fragment
        def render_order_item(row, enum_idx):
            sku_code = row['SKU코드']
            is_checked = sku_code in st.session_state.selected_items

            # 체크박스와 expander를 나란히 배치
            col_check, col_expand = st.columns([0.3, 4.7])

            with col_check:
                # 체크박스 키를 session_state와 동기화
                checkbox_key = f"sel_reorder_{sku_code}_{enum_idx}"
                if checkbox_key not in st.session_state:
                    st.session_state[checkbox_key] = is_checked

                # 체크박스 (value 파라미터 제거하여 충돌 방지)
                selected = st.checkbox("선택", key=checkbox_key, label_visibility="collapsed")

                # 전체 선택/해제 직후에는 개별 체크박스 로직 실행 안 함
                skip_logic = st.session_state.get('just_selected_all', False) or st.session_state.get('just_cleared_all', False)

                if not skip_logic:
                    if selected and sku_code not in st.session_state.selected_items:
                        st.session_state.selected_items.add(sku_code)
                    elif not selected and sku_code in st.session_state.selected_items:
                        st.session_state.selected_items.remove(sku_code)

            with col_expand:
                # Expander 상태를 session_state로 관리
                expander_key = f"expander_{sku_code}_{enum_idx}"
                if expander_key not in st.session_state:
                    st.session_state[expander_key] = False

                with st.expander(
                    f"{'🔴' if row['재고상태'] == '🔴 부족' else '🟡'} {row['SKU코드']} - {row['제품명']}",
                    expanded=st.session_state[expander_key]
                ):
                    col1, col2, col3 = st.columns([2, 1, 1])

                    with col1:
                        st.write(f"**ABC/XYZ**: {row['ABC등급']}/{row['XYZ등급']}")
                        st.write(f"**현재고**: {row['현재고']:,.0f}개")
                        st.write(f"**안전재고**: {row['안전재고']:,.0f}개")
                        st.write(f"**발주점**: {row['발주점']:,.0f}개")

                    # 발주량 입력을 먼저 처리 (col3)
                    with col3:
                        # 발주 수량 입력 (session_state 사용)
                        if sku_code not in st.session_state.custom_quantities:
                            st.session_state.custom_quantities[sku_code] = int(row['권장발주량'])

                        order_qty = st.number_input(
                            "발주량",
                            min_value=0,
                            value=st.session_state.custom_quantities.get(sku_code, int(row['권장발주량'])),
                            step=100,
                            key=f"qty_reorder_{sku_code}_{enum_idx}"
                        )
                        st.session_state.custom_quantities[sku_code] = order_qty

                    # 발주량 입력 후 재고소진일 계산 (col2)
                    with col2:
                        st.write(f"**일평균 판매**: {row['일평균판매']:.2f}개")
                        st.write(f"**리드타임**: {row['리드타임']:.0f}일")

                        # 발주 전/후 재고 소진일 계산 (업데이트된 발주량 사용)
                        current_days = row['재고소진일']
                        order_qty = st.session_state.custom_quantities.get(sku_code, int(row['권장발주량']))
                        after_order_days = int((row['현재고'] + order_qty) / row['일평균판매']) if row['일평균판매'] > 0 else 0

                        st.write(f"**📅 발주 전 재고소진일**: {current_days}일")
                        st.write(f"**📅 발주 후 재고소진일**: {after_order_days}일")
                        st.write(f"**상태**: {row['충분도상태']}")
                        st.write(f"**예상 입고일**:")
                        expected_date = datetime.now() + timedelta(days=row['리드타임'])
                        st.write(expected_date.strftime('%Y-%m-%d'))

        # 품목별 발주
        selected_items = []

        for enum_idx, (idx, row) in enumerate(need_order.iterrows()):
            render_order_item(row, enum_idx)

            # session_state를 직접 확인하여 selected_items에 추가
            sku_code = row['SKU코드']
            if sku_code in st.session_state.selected_items:
                selected_items.append({
                    'SKU코드': row['SKU코드'],
                    '제품명': row['제품명'],
                    '발주량': st.session_state.custom_quantities.get(sku_code, int(row['권장발주량']))
                })

        # 전체 선택/해제 플래그 초기화
        if 'just_selected_all' in st.session_state:
            st.session_state.just_selected_all = False
        if 'just_cleared_all' in st.session_state:
            st.session_state.just_cleared_all = False

        st.markdown("---")

        # 발주 실행
        if len(selected_items) > 0:
            st.subheader(f"선택된 품목: {len(selected_items)}개")

            df_selected = pd.DataFrame(selected_items)
            st.dataframe(df_selected, use_container_width=True)

            col1, col2, col3 = st.columns([1, 1, 2])

            with col1:
                # Excel 발주서 다운로드
                from io import BytesIO
                import openpyxl
                from openpyxl.styles import Font, Alignment, PatternFill

                # 발주서 Excel 생성
                wb = openpyxl.Workbook()
                ws = wb.active
                ws.title = "발주서"

                # 헤더
                ws['A1'] = '발주서'
                ws['A1'].font = Font(size=18, bold=True)
                ws['A2'] = f'발주일: {datetime.now().strftime("%Y-%m-%d %H:%M")}'

                # 컬럼 헤더
                headers = ['No', 'SKU코드', '제품명', '발주량', '비고']
                for col_idx, header in enumerate(headers, start=1):
                    cell = ws.cell(row=4, column=col_idx, value=header)
                    cell.font = Font(bold=True)
                    cell.fill = PatternFill(start_color="CCE5FF", end_color="CCE5FF", fill_type="solid")
                    cell.alignment = Alignment(horizontal='center')

                # 데이터
                for row_idx, item in enumerate(selected_items, start=5):
                    ws.cell(row=row_idx, column=1, value=row_idx-4)
                    ws.cell(row=row_idx, column=2, value=item['SKU코드'])
                    ws.cell(row=row_idx, column=3, value=item['제품명'])
                    ws.cell(row=row_idx, column=4, value=item['발주량'])
                    ws.cell(row=row_idx, column=5, value='')

                # 컬럼 너비 조정
                ws.column_dimensions['A'].width = 5
                ws.column_dimensions['B'].width = 20
                ws.column_dimensions['C'].width = 40
                ws.column_dimensions['D'].width = 12
                ws.column_dimensions['E'].width = 20

                # 바이트로 저장
                buffer = BytesIO()
                wb.save(buffer)
                buffer.seek(0)

                st.download_button(
                    label="📥 발주서 Excel 다운로드",
                    data=buffer,
                    file_name=f"발주서_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    type="primary"
                )

            with col2:
                # 복사용 텍스트
                if st.button("📋 발주 내역 복사"):
                    order_text = f"📦 발주 요청\n\n발주일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
                    order_text += "=" * 50 + "\n"
                    for idx, item in enumerate(selected_items, start=1):
                        order_text += f"{idx}. {item['SKU코드']} - {item['제품명']}\n"
                        order_text += f"   발주량: {item['발주량']}개\n\n"
                    order_text += "=" * 50 + "\n"
                    order_text += f"총 {len(selected_items)}개 품목"

                    st.text_area(
                        "아래 내용을 복사하세요",
                        value=order_text,
                        height=300
                    )

            with col3:
                # 전체 발주 실행
                if st.button("✅ 전체 발주 실행", type="primary", use_container_width=True):
                    total_qty = 0

                    # 모든 선택된 품목 발주
                    for item in selected_items:
                        sku = item['SKU코드']
                        qty = item['발주량']
                        st.session_state.order_history[sku] = {
                            'quantity': qty,
                            'timestamp': datetime.now(),
                            'product_name': item['제품명']
                        }
                        total_qty += qty

                    st.success(f"✅ 총 {len(selected_items)}개 품목, {total_qty:,}개 발주 완료!")
                    st.balloons()

                    # 선택 해제
                    st.session_state.selected_items = set()
                    st.rerun()
    else:
        st.success("✅ 현재 발주가 필요한 품목이 없습니다!")

def show_analysis(df_analysis, df_abc):
    """분석 화면"""
    st.header("📈 재고 분석")

    # ABC 분석
    st.subheader("ABC 등급별 분석")

    abc_summary = df_abc.groupby('ABC등급').agg({
        'SKU코드': 'count',
        '연간COGS': 'sum'
    }).reset_index()
    abc_summary.columns = ['ABC등급', 'SKU 수', '연간 COGS']
    abc_summary['비중%'] = abc_summary['연간 COGS'] / abc_summary['연간 COGS'].sum() * 100

    col1, col2 = st.columns(2)

    with col1:
        fig1 = px.bar(
            abc_summary,
            x='ABC등급',
            y='SKU 수',
            title='ABC 등급별 SKU 수',
            color='ABC등급',
            color_discrete_map={'A': '#dc2626', 'B': '#f59e0b', 'C': '#475569'}
        )
        fig1.update_layout(
            plot_bgcolor='#0a0a0a',
            paper_bgcolor='#0a0a0a',
            title_font=dict(size=15, color='#ffffff', family='Arial'),
            xaxis=dict(showgrid=False, title_font=dict(color='#e0e0e0')),
            yaxis=dict(showgrid=True, gridcolor='#2a2a2a', title_font=dict(color='#e0e0e0')),
            font=dict(color='#e0e0e0')
        )
        fig1.update_traces(marker_line_width=0, textposition='outside')
        st.plotly_chart(fig1, use_container_width=True)

    with col2:
        fig2 = px.pie(
            abc_summary,
            values='연간 COGS',
            names='ABC등급',
            title='ABC 등급별 매출 비중',
            color='ABC등급',
            color_discrete_map={'A': '#dc2626', 'B': '#f59e0b', 'C': '#475569'},
            hole=0.3
        )
        fig2.update_layout(
            plot_bgcolor='#0a0a0a',
            paper_bgcolor='#0a0a0a',
            title_font=dict(size=15, color='#ffffff', family='Arial'),
            font=dict(color='#e0e0e0')
        )
        fig2.update_traces(
            textfont=dict(size=12, color='white', family='Arial'),
            marker=dict(line=dict(color='#3a3a3a', width=2))
        )
        st.plotly_chart(fig2, use_container_width=True)

    # 테이블 표시용 포맷팅
    abc_display = abc_summary.copy()
    abc_display['연간 COGS'] = abc_display['연간 COGS'].apply(lambda x: f"{x:,.0f}")
    abc_display['비중%'] = abc_display['비중%'].apply(lambda x: f"{x:.2f}")

    st.dataframe(abc_display, use_container_width=True)

    st.markdown("---")

    # XYZ 분석
    st.subheader("XYZ 등급별 분석 (수요 변동성)")

    # XYZ 등급이 있는지 확인
    if 'XYZ등급' in df_analysis.columns:
        xyz_summary = df_analysis.groupby('XYZ등급').agg({
            'SKU코드': 'count',
            '현재고': 'sum'
        }).reset_index()
        xyz_summary.columns = ['XYZ등급', 'SKU 수', '총 재고량']
        xyz_summary['비중%'] = xyz_summary['SKU 수'] / xyz_summary['SKU 수'].sum() * 100

        col1, col2 = st.columns(2)

        with col1:
            fig_xyz1 = px.bar(
                xyz_summary,
                x='XYZ등급',
                y='SKU 수',
                title='XYZ 등급별 SKU 수',
                color='XYZ등급',
                color_discrete_map={'X': '#10b981', 'Y': '#f59e0b', 'Z': '#dc2626'}
            )
            fig_xyz1.update_layout(
                plot_bgcolor='#0a0a0a',
                paper_bgcolor='#0a0a0a',
                title_font=dict(size=15, color='#ffffff', family='Arial'),
                xaxis=dict(showgrid=False, title_font=dict(color='#e0e0e0')),
                yaxis=dict(showgrid=True, gridcolor='#2a2a2a', title_font=dict(color='#e0e0e0')),
                font=dict(color='#e0e0e0')
            )
            fig_xyz1.update_traces(marker_line_width=0, textposition='outside')
            st.plotly_chart(fig_xyz1, use_container_width=True)

        with col2:
            fig_xyz2 = px.pie(
                xyz_summary,
                values='SKU 수',
                names='XYZ등급',
                title='XYZ 등급별 SKU 비중',
                color='XYZ등급',
                color_discrete_map={'X': '#10b981', 'Y': '#f59e0b', 'Z': '#dc2626'},
                hole=0.3
            )
            fig_xyz2.update_layout(
                plot_bgcolor='#0a0a0a',
                paper_bgcolor='#0a0a0a',
                title_font=dict(size=15, color='#ffffff', family='Arial'),
                font=dict(color='#e0e0e0')
            )
            fig_xyz2.update_traces(
                textfont=dict(size=12, color='white', family='Arial'),
                marker=dict(line=dict(color='#3a3a3a', width=2))
            )
            st.plotly_chart(fig_xyz2, use_container_width=True)

        # 테이블 표시용 포맷팅
        xyz_display = xyz_summary.copy()
        xyz_display['총 재고량'] = xyz_display['총 재고량'].apply(lambda x: f"{x:,.0f}")
        xyz_display['비중%'] = xyz_display['비중%'].apply(lambda x: f"{x:.2f}")

        st.dataframe(xyz_display, use_container_width=True)

        # XYZ 등급 설명
        with st.expander("📖 XYZ 등급이란?"):
            st.markdown("""
            **XYZ 분석**은 수요의 변동성(예측 가능성)을 기준으로 재고를 분류합니다:

            - **X등급** 🟢: 변동성 낮음 (안정적 수요) - 예측이 쉬움
            - **Y등급** 🟡: 변동성 중간 - 예측이 보통
            - **Z등급** 🔴: 변동성 높음 (불안정 수요) - 예측이 어려움

            💡 **활용 팁**:
            - **AX** (높은 매출 + 안정적 수요): 최우선 재고 관리
            - **AZ** (높은 매출 + 불안정 수요): 안전재고 확보 필요
            - **CZ** (낮은 매출 + 불안정 수요): 최소 재고 유지
            """)

    st.markdown("---")

    # 재고회전 분석
    st.subheader("재고회전 분석")

    # 재고회전율 계산 (연간 판매 / 현재고)
    df_turnover = pd.merge(
        df_analysis[['SKU코드', '제품명', '현재고', 'ABC등급']],
        df_abc[['SKU코드', '연간판매']],
        on='SKU코드',
        how='left'
    )

    # 숫자 타입으로 변환
    df_turnover['연간판매'] = pd.to_numeric(df_turnover['연간판매'], errors='coerce').fillna(0)
    df_turnover['현재고'] = pd.to_numeric(df_turnover['현재고'], errors='coerce').fillna(0)

    df_turnover['재고회전율'] = df_turnover['연간판매'] / df_turnover['현재고'].replace(0, 1)
    df_turnover['재고회전일'] = 365 / df_turnover['재고회전율'].replace(0, 0.01)

    # 재고회전일을 숫자로 명시적 변환
    df_turnover['재고회전일'] = pd.to_numeric(df_turnover['재고회전일'], errors='coerce').fillna(999999)

    # TOP 10 느림 / 빠름
    col1, col2 = st.columns(2)

    with col1:
        st.write("**회전 느림 TOP 10** (개선 필요)")
        slow_turnover = df_turnover.nlargest(10, '재고회전일')[['SKU코드', '제품명', '재고회전일', 'ABC등급']]
        st.dataframe(slow_turnover, use_container_width=True)

    with col2:
        st.write("**회전 빠름 TOP 10**")
        fast_turnover = df_turnover[df_turnover['재고회전일'] > 0].nsmallest(10, '재고회전일')[['SKU코드', '제품명', '재고회전일', 'ABC등급']]
        st.dataframe(fast_turnover, use_container_width=True)

    st.markdown("---")

    # 재고회전일 상세 분석
    st.subheader("📊 재고회전일 상세 분석")

    # 재고회전일 구간 분류
    def classify_turnover_days(days):
        if days <= 30:
            return "0-30일 (우수)"
        elif days <= 60:
            return "31-60일 (양호)"
        elif days <= 90:
            return "61-90일 (보통)"
        else:
            return "90일 이상 (개선 필요)"

    df_turnover['회전구간'] = df_turnover['재고회전일'].apply(classify_turnover_days)

    # 구간별 통계
    col1, col2 = st.columns(2)

    with col1:
        # 구간별 SKU 수
        turnover_summary = df_turnover.groupby('회전구간').agg({
            'SKU코드': 'count'
        }).reset_index()
        turnover_summary.columns = ['회전구간', 'SKU 수']

        # 순서 정렬
        order = ["0-30일 (우수)", "31-60일 (양호)", "61-90일 (보통)", "90일 이상 (개선 필요)"]
        turnover_summary['회전구간'] = pd.Categorical(turnover_summary['회전구간'], categories=order, ordered=True)
        turnover_summary = turnover_summary.sort_values('회전구간')

        fig_turnover_bar = px.bar(
            turnover_summary,
            x='회전구간',
            y='SKU 수',
            title='재고회전일 구간별 SKU 수',
            color='회전구간',
            color_discrete_map={
                "0-30일 (우수)": '#10b981',
                "31-60일 (양호)": '#3b82f6',
                "61-90일 (보통)": '#f59e0b',
                "90일 이상 (개선 필요)": '#dc2626'
            }
        )
        fig_turnover_bar.update_layout(
            plot_bgcolor='#0a0a0a',
            paper_bgcolor='#0a0a0a',
            title_font=dict(size=15, color='#ffffff', family='Arial'),
            xaxis=dict(showgrid=False, title_font=dict(color='#e0e0e0')),
            yaxis=dict(showgrid=True, gridcolor='#2a2a2a', title_font=dict(color='#e0e0e0')),
            font=dict(color='#e0e0e0'),
            showlegend=False
        )
        fig_turnover_bar.update_traces(marker_line_width=0, textposition='outside')
        st.plotly_chart(fig_turnover_bar, use_container_width=True)

    with col2:
        # 재고회전일 분포 히스토그램
        df_turnover_filtered = df_turnover[df_turnover['재고회전일'] < 365]  # 365일 이상 제외

        fig_turnover_hist = px.histogram(
            df_turnover_filtered,
            x='재고회전일',
            nbins=20,
            title='재고회전일 분포',
            color_discrete_sequence=['#3b82f6']
        )
        fig_turnover_hist.update_layout(
            plot_bgcolor='#0a0a0a',
            paper_bgcolor='#0a0a0a',
            title_font=dict(size=15, color='#ffffff', family='Arial'),
            xaxis=dict(
                showgrid=False,
                title='재고회전일',
                title_font=dict(color='#e0e0e0')
            ),
            yaxis=dict(
                showgrid=True,
                gridcolor='#2a2a2a',
                title='SKU 수',
                title_font=dict(color='#e0e0e0')
            ),
            font=dict(color='#e0e0e0')
        )
        st.plotly_chart(fig_turnover_hist, use_container_width=True)

    # ABC 등급별 평균 재고회전일
    st.write("**ABC 등급별 평균 재고회전일**")
    abc_turnover = df_turnover.groupby('ABC등급').agg({
        '재고회전일': 'mean',
        'SKU코드': 'count'
    }).reset_index()
    abc_turnover.columns = ['ABC등급', '평균 재고회전일', 'SKU 수']
    abc_turnover['평균 재고회전일'] = abc_turnover['평균 재고회전일'].round(1)

    col1, col2, col3 = st.columns(3)
    for idx, row in abc_turnover.iterrows():
        with [col1, col2, col3][idx]:
            color = {'A': '🔴', 'B': '🟡', 'C': '⚫'}.get(row['ABC등급'], '⚪')
            st.metric(
                label=f"{color} {row['ABC등급']}등급 평균",
                value=f"{row['평균 재고회전일']:.1f}일",
                delta=f"{row['SKU 수']}개 SKU"
            )

    st.markdown("---")

    # 전체 상세 테이블
    with st.expander("📋 전체 SKU 재고회전일 상세 내역", expanded=False):
        st.write(f"총 {len(df_turnover)}개 SKU")

        # 정렬 옵션
        col1, col2 = st.columns([1, 3])
        with col1:
            sort_option = st.selectbox(
                "정렬 기준",
                ["재고회전일 느림순", "재고회전일 빠름순", "ABC등급", "SKU코드"]
            )

        # 정렬 적용
        if sort_option == "재고회전일 느림순":
            df_display = df_turnover.sort_values('재고회전일', ascending=False)
        elif sort_option == "재고회전일 빠름순":
            df_display = df_turnover[df_turnover['재고회전일'] > 0].sort_values('재고회전일', ascending=True)
        elif sort_option == "ABC등급":
            df_display = df_turnover.sort_values(['ABC등급', '재고회전일'], ascending=[True, False])
        else:
            df_display = df_turnover.sort_values('SKU코드')

        # 표시할 컬럼 선택
        display_columns = ['SKU코드', '제품명', 'ABC등급', '회전구간', '현재고', '연간판매', '재고회전율', '재고회전일']
        df_display = df_display[display_columns].copy()

        # 숫자 포맷팅
        df_display['현재고'] = df_display['현재고'].apply(lambda x: f"{x:,.0f}")
        df_display['연간판매'] = df_display['연간판매'].apply(lambda x: f"{x:,.0f}")
        df_display['재고회전율'] = df_display['재고회전율'].apply(lambda x: f"{x:.2f}")
        df_display['재고회전일'] = df_display['재고회전일'].apply(lambda x: f"{x:.1f}")

        # 테이블 표시
        st.dataframe(
            df_display,
            use_container_width=True,
            height=400
        )

        # 다운로드 버튼
        csv = df_display.to_csv(index=False, encoding='utf-8-sig')
        st.download_button(
            label="📥 CSV 다운로드",
            data=csv,
            file_name=f"재고회전일_상세_{datetime.now().strftime('%Y%m%d')}.csv",
            mime="text/csv"
        )

def show_kpi_management(df_analysis, df_psi, df_abc):
    """KPI 관리 화면 - 월별 목표 설정 및 달성도 추적"""
    st.header("🎯 KPI 관리")

    # KPI 설명 추가
    with st.expander("📖 KPI 항목별 설명 및 기준", expanded=False):
        st.markdown("""
        ### 📊 5가지 핵심 KPI 설명

        #### 1️⃣ 재고회전율 (Inventory Turnover Rate)
        **정의**: 연간 재고가 몇 번 회전(판매)되는지를 나타내는 지표
        **계산**: (월간 출고량 / 평균 재고) × 12
        **업종별 기준**:
        - 제조업: 8~12회 (월 1회)
        - 유통업: 12~24회 (월 2회)
        - 식품/패션: 24~52회 (주 1회)

        **중요성**: 높을수록 재고 효율이 좋으며, 재고 보관 비용 절감
        ⚠️ 너무 높으면 품절 위험 증가

        ---

        #### 2️⃣ 평균재고소진일 (Average Days of Inventory)
        **정의**: 현재 재고가 완전히 소진되기까지 걸리는 평균 일수
        **계산**: 현재고 / 일평균판매
        **기준**:
        - 우수: 20~30일
        - 양호: 30~45일
        - 주의: 45~60일
        - 개선 필요: 60일 초과

        **중요성**: 낮을수록 재고 회전이 빠르고 신선도 유지

        ---

        #### 3️⃣ 발주정확도 (Order Accuracy)
        **정의**: 적정 시점에 적정 수량을 발주한 비율
        **계산**: (적정 발주 품목 수 / 전체 발주 품목 수) × 100
        **기준**:
        - 우수: 95% 이상
        - 양호: 90~95%
        - 개선 필요: 90% 미만

        **중요성**: 높을수록 재고 낭비 감소, 물류비 절감
        💡 재고소진일 10~30일 사이 발주를 적정으로 간주

        ---

        #### 4️⃣ 품절률 (Stockout Rate)
        **정의**: 전체 품목 중 재고 부족(🔴) 상태인 품목의 비율
        **계산**: (재고 부족 품목 수 / 전체 품목 수) × 100
        **기준**:
        - 우수: 2% 미만
        - 양호: 2~5%
        - 주의: 5~10%
        - 위험: 10% 초과

        **중요성**: 낮을수록 좋으며, 판매 기회 손실 방지
        💰 품절 1회 = 매출 손실 + 고객 신뢰 하락

        ---

        #### 5️⃣ 과다재고율 (Overstock Rate)
        **정의**: 전체 품목 중 과잉 재고(🔵) 상태인 품목의 비율
        **계산**: (과다 재고 품목 수 / 전체 품목 수) × 100
        **기준**:
        - 우수: 5% 미만
        - 양호: 5~10%
        - 주의: 10~15%
        - 개선 필요: 15% 초과

        **중요성**: 낮을수록 재고 자금 효율적 운영
        💸 과다재고 = 보관비 증가 + 자금 묶임 + 진부화 위험

        ---

        ### 🎯 균형 있는 KPI 관리가 핵심!
        - **품절률 ↓** vs **과다재고율 ↓**: 양쪽 균형이 중요
        - **재고회전율 ↑** vs **품절률 ↓**: 적정선 유지 필요
        - **발주정확도 ↑**: 모든 KPI 개선의 핵심
        """)

    # 현재 월
    from datetime import datetime
    current_month = datetime.now().strftime("%Y-%m")
    current_month_num = datetime.now().month  # 1-12

    # KPI 목표 설정 (실무에서는 엑셀이나 DB에서 가져오지만, 여기서는 session_state 사용)
    if 'kpi_targets' not in st.session_state:
        st.session_state.kpi_targets = {
            '재고회전율': 12.0,    # 연간 12회 (월 1회)
            '평균재고소진일': 30.0,  # 30일 이내
            '발주정확도': 95.0,      # 95%
            '품절률': 2.0,           # 2% 이하
            '과다재고율': 10.0        # 10% 이하
        }

    # 월별 목표 설정
    with st.expander("📝 월별 목표 설정", expanded=False):
        st.write(f"**현재 월**: {current_month}")

        col1, col2 = st.columns(2)

        with col1:
            target_turnover = st.number_input(
                "목표 재고회전율 (연간)",
                min_value=1.0,
                max_value=50.0,
                value=st.session_state.kpi_targets['재고회전율'],
                step=0.5,
                help="연간 재고회전율 목표 (12회 = 월 1회)"
            )
            st.session_state.kpi_targets['재고회전율'] = target_turnover

            target_days = st.number_input(
                "목표 평균재고소진일 (일)",
                min_value=1.0,
                max_value=180.0,
                value=st.session_state.kpi_targets['평균재고소진일'],
                step=1.0,
                help="재고가 소진되기까지 평균 일수"
            )
            st.session_state.kpi_targets['평균재고소진일'] = target_days

            target_accuracy = st.number_input(
                "목표 발주정확도 (%)",
                min_value=50.0,
                max_value=100.0,
                value=st.session_state.kpi_targets['발주정확도'],
                step=1.0,
                help="발주한 품목 중 정확하게 발주한 비율"
            )
            st.session_state.kpi_targets['발주정확도'] = target_accuracy

        with col2:
            target_stockout = st.number_input(
                "목표 품절률 (%)",
                min_value=0.0,
                max_value=50.0,
                value=st.session_state.kpi_targets['품절률'],
                step=0.5,
                help="재고 부족으로 판매 불가한 품목 비율"
            )
            st.session_state.kpi_targets['품절률'] = target_stockout

            target_overstock = st.number_input(
                "목표 과다재고율 (%)",
                min_value=0.0,
                max_value=50.0,
                value=st.session_state.kpi_targets['과다재고율'],
                step=1.0,
                help="재고가 과다한 품목 비율"
            )
            st.session_state.kpi_targets['과다재고율'] = target_overstock

    st.markdown("---")

    # 현재 실적 계산
    st.subheader(f"📊 {current_month} 실적 현황")

    # 1. 재고회전율 계산 (출고 데이터 기반)
    if len(df_abc) > 0 and len(df_analysis) > 0:
        # 당월 출고 데이터 합계
        month_col = f'{current_month_num}월출고'
        if month_col in df_abc.columns:
            total_monthly_sales = df_abc[month_col].sum()
        else:
            # 컬럼이 없으면 연간판매를 12로 나눈 평균 사용
            total_monthly_sales = df_abc['연간판매'].sum() / 12 if '연간판매' in df_abc.columns else 0

        # 평균 재고
        avg_inventory = df_analysis['현재고'].sum()

        if avg_inventory > 0 and total_monthly_sales > 0:
            # 월간 회전율 × 12 = 연간 회전율
            current_turnover = (total_monthly_sales / avg_inventory) * 12
        else:
            current_turnover = 0
    else:
        current_turnover = 0

    # 2. 평균 재고소진일
    avg_days = df_analysis['재고소진일'].replace([float('inf'), -float('inf')], 999).mean()
    if pd.isna(avg_days) or avg_days > 365:
        avg_days = 999

    # 3. 품절률 (재고 부족 품목 비율)
    total_skus = len(df_analysis)
    stockout_skus = len(df_analysis[df_analysis['재고상태'] == '🔴 부족'])
    stockout_rate = (stockout_skus / total_skus * 100) if total_skus > 0 else 0

    # 4. 과다재고율 (과다 재고 품목 비율)
    overstock_skus = len(df_analysis[df_analysis['재고상태'] == '🔵 과잉'])
    overstock_rate = (overstock_skus / total_skus * 100) if total_skus > 0 else 0

    # 5. 발주정확도 (발주 필요 품목 대비 적정 발주 비율 - 간략화)
    need_order_skus = len(df_analysis[df_analysis['발주필요'] == True])
    if need_order_skus > 0:
        # 재고소진일이 10-30일 사이인 것을 적정 발주로 간주
        proper_orders = len(df_analysis[
            (df_analysis['발주필요'] == True) &
            (df_analysis['재고소진일'] >= 10) &
            (df_analysis['재고소진일'] <= 30)
        ])
        order_accuracy = (proper_orders / need_order_skus * 100)
    else:
        order_accuracy = 100.0

    # KPI 카드 표시
    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        delta1 = current_turnover - st.session_state.kpi_targets['재고회전율']
        st.metric(
            label="재고회전율 (연간)",
            value=f"{current_turnover:.1f}회",
            delta=f"{delta1:+.1f}",
            delta_color="normal"
        )
        if current_turnover >= st.session_state.kpi_targets['재고회전율']:
            st.success("✅ 목표 달성")
        else:
            st.error(f"❌ 목표: {st.session_state.kpi_targets['재고회전율']:.1f}회")

    with col2:
        delta2 = -(avg_days - st.session_state.kpi_targets['평균재고소진일'])  # 낮을수록 좋음
        st.metric(
            label="평균 재고소진일",
            value=f"{avg_days:.1f}일",
            delta=f"{delta2:+.1f}일" if abs(delta2) < 100 else "N/A",
            delta_color="normal"
        )
        if avg_days <= st.session_state.kpi_targets['평균재고소진일']:
            st.success("✅ 목표 달성")
        else:
            st.error(f"❌ 목표: {st.session_state.kpi_targets['평균재고소진일']:.1f}일")

    with col3:
        delta3 = order_accuracy - st.session_state.kpi_targets['발주정확도']
        st.metric(
            label="발주 정확도",
            value=f"{order_accuracy:.1f}%",
            delta=f"{delta3:+.1f}%",
            delta_color="normal"
        )
        if order_accuracy >= st.session_state.kpi_targets['발주정확도']:
            st.success("✅ 목표 달성")
        else:
            st.error(f"❌ 목표: {st.session_state.kpi_targets['발주정확도']:.1f}%")

    with col4:
        delta4 = -(stockout_rate - st.session_state.kpi_targets['품절률'])  # 낮을수록 좋음
        st.metric(
            label="품절률",
            value=f"{stockout_rate:.1f}%",
            delta=f"{delta4:+.1f}%",
            delta_color="inverse"
        )
        if stockout_rate <= st.session_state.kpi_targets['품절률']:
            st.success("✅ 목표 달성")
        else:
            st.error(f"❌ 목표: {st.session_state.kpi_targets['품절률']:.1f}%")

    with col5:
        delta5 = -(overstock_rate - st.session_state.kpi_targets['과다재고율'])  # 낮을수록 좋음
        st.metric(
            label="과다재고율",
            value=f"{overstock_rate:.1f}%",
            delta=f"{delta5:+.1f}%",
            delta_color="inverse"
        )
        if overstock_rate <= st.session_state.kpi_targets['과다재고율']:
            st.success("✅ 목표 달성")
        else:
            st.error(f"❌ 목표: {st.session_state.kpi_targets['과다재고율']:.1f}%")

    st.markdown("---")

    # 월별 추이 (시뮬레이션 - 실제로는 DB에서 가져와야 함)
    st.subheader("📈 월별 KPI 추이")

    import plotly.graph_objects as go

    # 샘플 데이터 (실제로는 DB에서 가져와야 함)
    months = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', current_month]
    turnover_history = [10.5, 11.2, 11.8, 12.3, 11.9, current_turnover]
    days_history = [35, 33, 31, 29, 31, avg_days]
    accuracy_history = [92, 93, 94, 95, 94, order_accuracy]

    tab_chart1, tab_chart2, tab_chart3 = st.tabs(["재고회전율", "재고소진일", "발주정확도"])

    with tab_chart1:
        fig1 = go.Figure()
        fig1.add_trace(go.Scatter(
            x=months,
            y=turnover_history,
            mode='lines+markers',
            name='실적',
            line=dict(color='#3b82f6', width=3)
        ))
        fig1.add_trace(go.Scatter(
            x=months,
            y=[st.session_state.kpi_targets['재고회전율']] * len(months),
            mode='lines',
            name='목표',
            line=dict(color='#ffffff', width=2, dash='dash')
        ))
        fig1.update_layout(
            title='재고회전율 추이',
            xaxis_title='월',
            yaxis_title='회전율 (연간)',
            plot_bgcolor='#0a0a0a',
            paper_bgcolor='#0a0a0a',
            title_font=dict(color='#ffffff'),
            xaxis=dict(color='#e0e0e0', gridcolor='#2a2a2a'),
            yaxis=dict(color='#e0e0e0', gridcolor='#2a2a2a'),
            font=dict(color='#e0e0e0'),
            height=400
        )
        st.plotly_chart(fig1, use_container_width=True)

    with tab_chart2:
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(
            x=months,
            y=days_history,
            mode='lines+markers',
            name='실적',
            line=dict(color='#10b981', width=3)
        ))
        fig2.add_trace(go.Scatter(
            x=months,
            y=[st.session_state.kpi_targets['평균재고소진일']] * len(months),
            mode='lines',
            name='목표',
            line=dict(color='#ffffff', width=2, dash='dash')
        ))
        fig2.update_layout(
            title='평균 재고소진일 추이',
            xaxis_title='월',
            yaxis_title='일수',
            plot_bgcolor='#0a0a0a',
            paper_bgcolor='#0a0a0a',
            title_font=dict(color='#ffffff'),
            xaxis=dict(color='#e0e0e0', gridcolor='#2a2a2a'),
            yaxis=dict(color='#e0e0e0', gridcolor='#2a2a2a'),
            font=dict(color='#e0e0e0'),
            height=400
        )
        st.plotly_chart(fig2, use_container_width=True)

    with tab_chart3:
        fig3 = go.Figure()
        fig3.add_trace(go.Scatter(
            x=months,
            y=accuracy_history,
            mode='lines+markers',
            name='실적',
            line=dict(color='#f59e0b', width=3)
        ))
        fig3.add_trace(go.Scatter(
            x=months,
            y=[st.session_state.kpi_targets['발주정확도']] * len(months),
            mode='lines',
            name='목표',
            line=dict(color='#ffffff', width=2, dash='dash')
        ))
        fig3.update_layout(
            title='발주 정확도 추이',
            xaxis_title='월',
            yaxis_title='정확도 (%)',
            plot_bgcolor='#0a0a0a',
            paper_bgcolor='#0a0a0a',
            title_font=dict(color='#ffffff'),
            xaxis=dict(color='#e0e0e0', gridcolor='#2a2a2a'),
            yaxis=dict(color='#e0e0e0', gridcolor='#2a2a2a'),
            font=dict(color='#e0e0e0'),
            height=400
        )
        st.plotly_chart(fig3, use_container_width=True)

    st.markdown("---")

    # 개선 제안
    st.subheader("💡 개선 제안")

    improvement_suggestions = []

    if current_turnover < st.session_state.kpi_targets['재고회전율']:
        improvement_suggestions.append(
            f"⚠️ **재고회전율 개선 필요**: 현재 {current_turnover:.1f}회 → 목표 {st.session_state.kpi_targets['재고회전율']:.1f}회"
        )
        improvement_suggestions.append("   → 느린 회전 품목 재고 축소, 빠른 회전 품목 재고 확대")

    if avg_days > st.session_state.kpi_targets['평균재고소진일']:
        improvement_suggestions.append(
            f"⚠️ **재고소진일 단축 필요**: 현재 {avg_days:.1f}일 → 목표 {st.session_state.kpi_targets['평균재고소진일']:.1f}일"
        )
        improvement_suggestions.append("   → 과다 재고 품목 판촉, 발주량 조정")

    if order_accuracy < st.session_state.kpi_targets['발주정확도']:
        improvement_suggestions.append(
            f"⚠️ **발주정확도 향상 필요**: 현재 {order_accuracy:.1f}% → 목표 {st.session_state.kpi_targets['발주정확도']:.1f}%"
        )
        improvement_suggestions.append("   → 수요 예측 정확도 향상, 리드타임 관리 강화")

    if stockout_rate > st.session_state.kpi_targets['품절률']:
        improvement_suggestions.append(
            f"⚠️ **품절률 감소 필요**: 현재 {stockout_rate:.1f}% → 목표 {st.session_state.kpi_targets['품절률']:.1f}%"
        )
        improvement_suggestions.append("   → 안전재고 확보, 발주 타이밍 앞당기기")

    if overstock_rate > st.session_state.kpi_targets['과다재고율']:
        improvement_suggestions.append(
            f"⚠️ **과다재고율 감소 필요**: 현재 {overstock_rate:.1f}% → 목표 {st.session_state.kpi_targets['과다재고율']:.1f}%"
        )
        improvement_suggestions.append("   → 과다 재고 품목 판매 촉진, 발주량 축소")

    if len(improvement_suggestions) == 0:
        st.success("🎉 **모든 KPI 목표 달성!** 현재 재고 관리가 우수합니다.")
    else:
        for suggestion in improvement_suggestions:
            st.warning(suggestion)

def show_order_status(df_analysis):
    """발주 현황 대시보드"""

    st.header("📋 발주 현황 대시보드")

    # 발주 통계
    col1, col2, col3, col4 = st.columns(4)

    # 오늘 발주
    today = datetime.now().date()
    today_orders = [v for k, v in st.session_state.order_history.items()
                    if v['timestamp'].date() == today]

    with col1:
        st.metric(
            label="오늘 발주",
            value=f"{len(today_orders)}건"
        )

    # 이번주 발주
    week_start = today - timedelta(days=today.weekday())
    week_orders = [v for k, v in st.session_state.order_history.items()
                   if v['timestamp'].date() >= week_start]

    with col2:
        st.metric(
            label="이번주 발주",
            value=f"{len(week_orders)}건"
        )

    # 이번달 발주
    month_start = today.replace(day=1)
    month_orders = [v for k, v in st.session_state.order_history.items()
                    if v['timestamp'].date() >= month_start]

    with col3:
        st.metric(
            label="이번달 발주",
            value=f"{len(month_orders)}건"
        )

    # 전체 발주
    with col4:
        st.metric(
            label="전체 발주",
            value=f"{len(st.session_state.order_history)}건"
        )

    st.markdown("---")

    # 미발주 위험 품목
    need_order = df_analysis[
        (df_analysis['발주필요'] == True) &
        (df_analysis['권장발주량'] > 0)
    ]

    not_ordered = []
    for idx, row in need_order.iterrows():
        if row['SKU코드'] not in st.session_state.order_history:
            not_ordered.append(row)

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader(f"🔴 미발주 위험 품목: {len(not_ordered)}건")
        if len(not_ordered) > 0:
            for row in not_ordered[:5]:
                st.warning(f"{row['SKU코드']} - {row['제품명']} (재고: {row['재고소진일']}일치)")

    with col2:
        st.subheader(f"🟢 발주 완료: {len(st.session_state.order_history)}건")
        if len(st.session_state.order_history) > 0:
            for sku, info in list(st.session_state.order_history.items())[:5]:
                days_ago = (datetime.now() - info['timestamp']).days
                st.success(f"{sku} - {info['quantity']:,}개 ({days_ago}일 전)")

    st.markdown("---")

    # 발주 이력 테이블
    st.subheader("📋 발주 이력")

    if len(st.session_state.order_history) > 0:
        # DataFrame 생성
        history_data = []
        for sku, info in st.session_state.order_history.items():
            history_data.append({
                '발주일시': info['timestamp'].strftime('%Y-%m-%d %H:%M'),
                'SKU코드': sku,
                '제품명': info['product_name'],
                '발주량': f"{info['quantity']:,}개",
                '경과': f"{(datetime.now() - info['timestamp']).days}일 전"
            })

        df_history = pd.DataFrame(history_data)
        df_history = df_history.sort_values('발주일시', ascending=False)

        st.dataframe(df_history, use_container_width=True, height=400)

        # Excel 다운로드
        from io import BytesIO
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_history.to_excel(writer, index=False, sheet_name='발주이력')

        output.seek(0)
        st.download_button(
            label="📥 발주 이력 Excel 다운로드",
            data=output,
            file_name=f"발주이력_{datetime.now().strftime('%Y%m%d')}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    else:
        st.info("발주 이력이 없습니다.")

def show_settings():
    """설정 화면"""
    st.header("⚙️ 시스템 설정")

    st.subheader("발주 정책 설정")

    col1, col2 = st.columns(2)

    with col1:
        st.write("**A등급 설정**")
        a_safety_multiplier = st.slider("안전재고 배수", 1.0, 2.0, 1.5, 0.1, key="a_safety")
        a_order_cycle = st.selectbox("발주 주기", ["주 1회", "월 1회", "격주 1회"], index=1, key="a_cycle")

        st.write("**B등급 설정**")
        b_safety_multiplier = st.slider("안전재고 배수", 1.0, 2.0, 1.2, 0.1, key="b_safety")
        b_order_cycle = st.selectbox("발주 주기", ["월 1회", "격월 1회", "분기 1회"], index=1, key="b_cycle")

    with col2:
        st.write("**C등급 설정**")
        c_safety_multiplier = st.slider("안전재고 배수", 0.5, 1.5, 1.0, 0.1, key="c_safety")
        c_order_cycle = st.selectbox("발주 주기", ["분기 1회", "반기 1회", "수요 기반"], index=0, key="c_cycle")

        st.write("**알림 설정**")
        email_notification = st.checkbox("이메일 알림", value=True)
        kakao_notification = st.checkbox("카카오톡 알림", value=False)

    st.markdown("---")

    st.subheader("리드타임 설정")

    default_leadtime = st.number_input("기본 리드타임 (일)", min_value=1, value=30, step=1)

    st.markdown("---")

    if st.button("💾 설정 저장", type="primary"):
        st.success("✅ 설정이 저장되었습니다!")

# 앱 실행
if __name__ == "__main__":
    main()
