import re
import unicodedata


_TOKEN_RE = re.compile(r"[0-9a-zA-ZÀ-ỹĐđ]+", re.UNICODE)


class VietnameseTextProcessor:
    """Chuẩn hoá nhẹ, giữ dấu cho semantic và thêm dạng bỏ dấu cho lexical search."""

    @staticmethod
    def normalize(text: str) -> str:
        text = unicodedata.normalize("NFC", text or "")
        text = re.sub(r"[\u200b-\u200d\ufeff]", "", text)
        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def fold_accents(text: str) -> str:
        text = text.replace("đ", "d").replace("Đ", "D")
        return "".join(
            char
            for char in unicodedata.normalize("NFD", text)
            if unicodedata.category(char) != "Mn"
        )

    @classmethod
    def tokens(cls, text: str) -> list[str]:
        exact = [token.lower() for token in _TOKEN_RE.findall(cls.normalize(text))]
        folded = [cls.fold_accents(token) for token in exact]

        # Bigrams giúp giữ cụm đa âm tiết như "khai sinh", "thường trú".
        exact_bigrams = [f"{a}_{b}" for a, b in zip(exact, exact[1:])]
        folded_bigrams = [f"{a}_{b}" for a, b in zip(folded, folded[1:])]
        return exact + folded + exact_bigrams + folded_bigrams
