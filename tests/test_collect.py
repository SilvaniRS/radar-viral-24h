import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('collector',Path(__file__).resolve().parents[1]/'scripts'/'collect.py')
collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)

def test_google_trends():
    xml=b'''<?xml version="1.0"?><rss xmlns:ht="https://trends.google.com/trending/rss"><channel><item><title>Example worldwide topic</title><pubDate>Fri, 20 Nov 2026 10:00:00 GMT</pubDate><ht:approx_traffic>20,000+</ht:approx_traffic><ht:news_item><ht:news_item_title>Example reported</ht:news_item_title><ht:news_item_url>https://example.org/story</ht:news_item_url><ht:news_item_source>Example Org</ht:news_item_source></ht:news_item></item></channel></rss>'''
    result=collector.parse_trends(xml,'US')
    assert len(result)==1
    assert result[0]['kind']=='pesquisa'
    assert result[0]['traffic']=='20,000+'
    assert result[0]['url']=='https://example.org/story'

def test_google_news():
    xml=b'''<?xml version="1.0"?><rss><channel><item><title>Testing data - BBC</title><link>https://news.google.com/a</link><pubDate>Fri, 20 Nov 2026 10:00:00 GMT</pubDate><source>BBC</source></item></channel></rss>'''
    result=collector.parse_news(xml,'GB')
    assert len(result)==1 and result[0]['source']=='BBC'
    assert result[0]['kind']=='noticia'
