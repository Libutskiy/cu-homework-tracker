import json
import httpx
from fastapi import HTTPException
from typing import List, Dict

def get_file_cookies() -> str:
    try:
        with open("cookies.json", "r", encoding="utf-8") as f:
            cookies_list = json.load(f)
        cookie_parts = []
        for c in cookies_list:
            cookie_parts.append(f"{c['name']}={c['value']}")
        return "; ".join(cookie_parts)
    except Exception as e:
        print("Error reading cookies.json:", e)
        return ""

async def fetch_lms_tasks(cookie_str: str) -> List[Dict]:
    url = "https://my.centraluniversity.ru/api/micro-lms/tasks/student"
    params = [
        ("state", "inProgress"),
        ("state", "review"),
        ("state", "backlog"),
    ]
    
    # Sanitize the cookie string to strip non-ascii characters 
    sanitized_cookie = cookie_str.encode("ascii", "ignore").decode("ascii")
    
    headers = {
        "Cookie": sanitized_cookie,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(verify=False) as client:
        response = await client.get(url, headers=headers, params=params)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Unauthorized. Please re-authenticate in browser.")
        elif response.status_code == 403:
            raise HTTPException(status_code=403, detail="Forbidden. No student privileges.")
        else:
            raise HTTPException(status_code=response.status_code, detail=f"LMS Error: {response.text}")
