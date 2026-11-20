#!/usr/bin/env python3
"""Radar Viral 24H: coleta pautas públicas por país, sem API privada.
A coleta mostra tendências de pesquisa e manchetes, não métricas do TikTok.
"""
import concurrent.futures
import datetime as dt
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "web" / "data" / "topics.json"
COUNTRIES = {
    "BR": {"label": "Brasil", "locale": "pt-BR", "ceid": "BR:pt-419", "lang": "pt", "flag": "🇧🇷"},
    "US": {"label": "Estados Unidos", "locale": "en-US", "ceid": "US:en", "lang": "en", "flag": "🇺🇸"},
    "MX": {"label": "México", "locale": "es-419", "ceid": "MX:es-419", "lang": "es", "flag": "🇲🇽"},
    "PT": {"label": "Portugal", "locale": "pt-PT", "ceid": "PT:pt-150", "lang": "pt", "flag": "🇵🇹"},
    "ES": {"label": "Espanha", "locale": "es-ES", "ceid": "ES:es", "lang": "es", "flag": "🇪🇸"},
    "GB": {"label": "Reino Unido", "locale": "en-GB", "ceid": "GB:en", "lang": "en", "flag": "🇬🇧"},
}
HT = "{https://trends.google.com/trending/rss}"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; RadarViral24h/1.0; public-trends-reader)", "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=18) as resp:
        if resp.status != 200:
            raise ValueError(f"HTTP {resp.status}")
        return resp.read(3_500_000)

def txt(el, path, default=""):
    if el is None:
        return default
    val = el.findtext(path)
    return (val or default).strip()

def stripped(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", s).strip()

def parse_trends(xml_bytes, country):
    root = ET.fromstring(xml_bytes)
    found = []
    for item in root.findall(".//channel/item")[:15]:
        title = stripped(txt(item,"title"))
        if not title: continue
        traffic = txt(item, HT + "approx_traffic")
        published = txt(item,"pubDate")
        articles=[]
        for news in item.findall(HT + "news_item"):
            url=txt(news,HT + "news_item_url")
            if url.startswith("https://"):
                articles.append({"url":url,"title":stripped(txt(news,HT+"news_item_title")),"source":txt(news,HT+"news_item_source")})
        link=articles[0]["url"] if articles else txt(item,"link")
        found.append({"title":title,"kind":"pesquisa","traffic":traffic,"published":published,
                      "url":link if link.startswith("https://") else "https://trends.google.com/trending?geo="+country,
                      "source": articles[0]["source"] if articles else "Google Trends",
                      "evidence_count":len(articles),"country":country})
    return found

def parse_news(xml_bytes,country):
    root=ET.fromstring(xml_bytes)
    results=[]
    for item in root.findall(".//channel/item")[:20]:
        title=stripped(txt(item,"title"))
        if not title: continue
        link=txt(item,"link")
        source_element=item.find("source")
        source=source_element.text.strip() if source_element is not None and source_element.text else "Google Notícias"
        results.append({"title":title,"kind":"noticia","traffic":"","published":txt(item,"pubDate"),
                        "url":link if link.startswith("https://") else "https://news.google.com/",
                        "source":source,"evidence_count":1,"country":country})
    return results

def collect_country(code):
    conf=COUNTRIES[code]
    errors=[]
    items=[]
    trends_url="https://trends.google.com/trending/rss?"+urllib.parse.urlencode({"geo":code})
    news_url="https://news.google.com/rss?"+urllib.parse.urlencode({"hl":conf["locale"],"gl":code,"ceid":conf["ceid"]})
    for kind,url,parser in [("pesquisa",trends_url,parse_trends),("noticia",news_url,parse_news)]:
        try:
            items.extend(parser(fetch(url),code))
        except Exception as e:
            errors.append(f"{kind}: {type(e).__name__}: {str(e)[:100]}")
    seen=set();uniq=[]
    for item in items:
        norm=re.sub(r"\W+","",item["title"].lower())[:75]
        if norm not in seen:
            uniq.append(item)
            seen.add(norm)
    return code, uniq, errors

def main():
    now=dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    all_items=[]; errors={}; stats={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        for code, items, err in executor.map(collect_country,COUNTRIES):
            stats[code]=len(items)
            if err: errors[code]=err
            all_items.extend(items)
    if not all_items:
        # Avoid overwriting previously successful data with an empty file.
        if OUTPUT.exists():
            old=json.loads(OUTPUT.read_text(encoding="utf-8"))
            if old.get("items"):
                print("Todas as fontes indisponíveis; preservado último arquivo válido")
                return
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    data={"updated_at":now,"source_note":"Google Trends RSS e Google Notícias RSS. Não são métricas do TikTok.",
          "countries":COUNTRIES,"counts":stats,"errors":errors,"items":all_items}
    OUTPUT.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Pautas salvas: {len(all_items)} | países: {stats} | erros: {errors}")
if __name__ == "__main__":
    main()
