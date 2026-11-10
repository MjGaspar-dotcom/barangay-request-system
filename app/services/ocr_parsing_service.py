import re
from datetime import datetime


class OcrParsingService:
    @staticmethod
    def parse(raw_text):
        text = OcrParsingService._normalize(raw_text)
        id_type = OcrParsingService._detect_id_type(text)
        name = OcrParsingService._extract_name(text)
        birth_date = OcrParsingService._extract_birth_date(text)
        fields = {
            "id_type": id_type,
            "id_number": OcrParsingService._extract_id_number(text),
            "first_name": name["first_name"],
            "middle_name": name["middle_name"],
            "last_name": name["last_name"],
            "birth_date": birth_date,
        }
        return {
            **fields,
            "full_name": name["full_name"],
            "gender": OcrParsingService._extract_gender(text),
            "address": OcrParsingService._extract_address(text),
            "confidence_score": OcrParsingService._calculate_confidence(fields),
            "raw_text": raw_text,
        }

    @staticmethod
    def _normalize(text):
        text = re.sub(r"\b0OB\b|\bD\.O\.B\b", "DOB", text, flags=re.I)
        return re.sub(r"\bKasah an\b", "Kasarian", text, flags=re.I)

    @staticmethod
    def _detect_id_type(text):
        checks = (
            (r"(philid|philippine identification|republika ng pilipinas|philsys)", "Philippine National ID (PhilID)"),
            (r"(driver|\blto\b|land transportation office|license)", "Driver's License"),
            (r"(umid|unified multi|sss|gsis)", "Unified Multi-Purpose ID (UMID)"),
            (r"(voter|comelec|commission on elections)", "Voter's ID"),
            (r"(barangay|punong barangay|resident card)", "Barangay ID"),
            (r"(passport|dfa|foreign affairs)", "Passport"),
            (r"(tin|taxpayer|bureau of internal revenue|\bbir\b)", "TIN ID"),
            (r"(postal|phlpost|philippine postal)", "Postal ID"),
        )
        for pattern, id_type in checks:
            if re.search(pattern, text, re.I):
                return id_type
        return "Government / Valid ID"

    @staticmethod
    def _extract_id_number(text):
        patterns = (
            r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b|\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
            r"\b[A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6}\b",
            r"\b\d{4}[-\s]?\d{7}[-\s]?\d|\b\d{2}[-\s]?\d{7}[-\s]?\d\b",
            r"(?:ID(?:\s*(?:No|Number))?|No|Number|CRN|No\.)[:]\s*([A-Z0-9-]{6,20})",
        )
        for index, pattern in enumerate(patterns):
            match = re.search(pattern, text, re.I)
            if match:
                value = match.group(1) if match.lastindex else match.group(0)
                return value.strip().upper() if index == 1 else value.strip().replace(" ", "-")
        return None

    @staticmethod
    def _extract_name(text):
        last_name = first_name = middle_name = None
        for line in text.splitlines():
            if not last_name:
                match = re.search(r"(?:Surname|Apelyido|Last\s*Name).*:[\s]*([A-Z\sñÑ-]+)", line, re.I)
                if match:
                    last_name = match.group(1).strip()
            if not first_name:
                match = re.search(r"(?:Given|Mga\s*Pangalan|First\s*Name).*:[\s]*([A-Z\sñÑ-]+)", line, re.I)
                if match:
                    first_name = match.group(1).strip()
            if not middle_name:
                match = re.search(r"(?:Middle\s*Name|Gitnang\s*Apelyido).*:[\s]*([A-Z\sñÑ-]+)", line, re.I)
                if match:
                    middle_name = match.group(1).strip()

        if not first_name and not last_name:
            match = re.search(r"(?:Name|Pangalan).*:[\s]*([A-Z\sñÑ,-]+)", text, re.I)
            if match:
                parts = re.split(r"[\s,]+", match.group(1).strip(), maxsplit=1)
                last_name = parts[0] if parts else None
                first_name = parts[1].strip() if len(parts) > 1 else None

        full_name = " ".join(value for value in (first_name, middle_name, last_name) if value) or None
        return {"first_name": first_name, "middle_name": middle_name, "last_name": last_name, "full_name": full_name}

    @staticmethod
    def _extract_birth_date(text):
        match = re.search(
            r"(?:DOB|Date\s*of\s*Birth|Birth\s*Date|Kaarawan|Petsa\s*ng\s*Kapanganakan).*:[\s]*([A-Z0-9\s,\/.-]{6,20})",
            text,
            re.I,
        )
        candidate = match.group(1).strip() if match else None
        if candidate:
            parsed = OcrParsingService._parse_date(candidate)
            if parsed:
                return parsed

        match = re.search(r"\b(?:\d{2}[-/.]\d{2}[-/.]\d{4}|\d{4}[-/.]\d{2}[-/.]\d{2})\b", text)
        return OcrParsingService._parse_date(match.group(0)) if match else None

    @staticmethod
    def _parse_date(value):
        for date_format in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%d-%m-%Y", "%B %d, %Y"):
            try:
                return datetime.strptime(value.strip(), date_format).strftime("%Y-%m-%d")
            except ValueError:
                pass
        return None

    @staticmethod
    def _extract_gender(text):
        match = re.search(r"(?:Sex|Gender|Kasarian).*:[\s]*(Male|Female|Lalaki|Babae|M|F)\b", text, re.I)
        if not match:
            return None
        return "Male" if match.group(1).upper() in {"M", "MALE", "Lalaki".upper()} else "Female"

    @staticmethod
    def _extract_address(text):
        match = re.search(r"(?:Address|Tirahan).*:[\s]*([^\r\n]+)", text, re.I)
        if match:
            return match.group(1).strip()
        match = re.search(r"(?:Brgy\.?|Barangay)\s+([A-Za-z0-9\s-]+)", text.splitlines()[-1], re.I)
        return f"Barangay {match.group(1).strip()}" if match else None

    @staticmethod
    def _calculate_confidence(fields):
        score = 20 if fields["id_type"] != "Government / Valid ID" else 0
        score += 30 if fields["id_number"] else 0
        score += 20 if fields["first_name"] else 0
        score += 15 if fields["last_name"] else 0
        score += 15 if fields["birth_date"] else 0
        return min(100, score)
