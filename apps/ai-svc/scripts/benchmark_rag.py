import asyncio
import os
import sys
import httpx

# Thêm đường dẫn tới thư mục gốc của ai-svc để import app module
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.config import get_settings
from app.services.hybrid_search import HybridLegalSearch
from app.services.llm import GroundedLLM
from app.services.rag import RAGEngine

TEST_CASES = [
    {
        "query": "Thủ tục cấp Giấy chứng nhận quyền sử dụng đất cần những giấy tờ gì?",
        "expected_keywords": ["đơn", "giấy tờ", "chứng nhận", "quyền sử dụng đất"],
        "expected_articles": ["Điều 70", "Điều 71"]
    },
    {
        "query": "Thời gian giải quyết thủ tục đăng ký thường trú là bao lâu?",
        "expected_keywords": ["thời hạn", "đăng ký thường trú", "ngày"],
        "expected_articles": ["Điều 22", "Luật Cư trú"]
    },
    {
        "query": "Người bao nhiêu tuổi thì được cấp Căn cước công dân?",
        "expected_keywords": ["tuổi", "căn cước", "công dân"],
        "expected_articles": ["Điều 19"]
    }
]

async def run_benchmark():
    settings = get_settings()
    http_client = httpx.AsyncClient()
    try:
        search = HybridLegalSearch(settings, http_client)
        llm = GroundedLLM(settings, http_client)
        rag = RAGEngine(settings, search, llm)
        
        print("=== BẮT ĐẦU ĐÁNH GIÁ RAG (BENCHMARK) ===")
        total_precision = 0.0
        total_recall = 0.0
        valid_cases = 0
        
        for idx, case in enumerate(TEST_CASES, 1):
            query = case["query"]
            print(f"\n[{idx}] Đang query: {query}")
            
            try:
                results = await rag.retrieve(query, top_k=5)
            except Exception as e:
                print(f"  -> Lỗi kết nối: {e}")
                continue
                
            retrieved_text = " ".join([r.text for r in results]).lower()
            
            keywords = [k.lower() for k in case["expected_keywords"]]
            hits = sum(1 for k in keywords if k in retrieved_text)
            recall = hits / len(keywords) if keywords else 1.0
            
            articles = [a.lower() for a in case["expected_articles"]]
            article_hits = sum(1 for a in articles if a in retrieved_text)
            precision = article_hits / len(articles) if articles else 1.0
            
            print(f"  -> Trả về {len(results)} chunks.")
            print(f"  -> Recall: {recall:.2%} | Precision: {precision:.2%}")
            
            total_recall += recall
            total_precision += precision
            valid_cases += 1
            
        if valid_cases > 0:
            avg_precision = total_precision / valid_cases
            avg_recall = total_recall / valid_cases
            print("\n=== TỔNG KẾT BENCHMARK ===")
            print(f"Tổng số case test: {valid_cases}")
            print(f"Average Precision: {avg_precision:.2%} (Mục tiêu > 80%)")
            print(f"Average Recall:    {avg_recall:.2%} (Mục tiêu > 75%)")
            
            if avg_precision > 0.8 and avg_recall > 0.75:
                print(">> KẾT QUẢ: ĐẠT YÊU CẦU ✅")
            else:
                print(">> KẾT QUẢ: CẦN CẢI THIỆN ❌")
        else:
            print("\nKhông thể chạy benchmark.")
    finally:
        await http_client.aclose()

if __name__ == "__main__":
    asyncio.run(run_benchmark())
