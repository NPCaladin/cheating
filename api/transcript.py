from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        video_id = params.get("id", [""])[0]

        transcript_text = ""
        if video_id:
            try:
                from youtube_transcript_api import YouTubeTranscriptApi

                fetcher = YouTubeTranscriptApi()
                try:
                    t = fetcher.fetch(video_id, languages=["ko"])
                except Exception:
                    t = fetcher.fetch(video_id)
                transcript_text = " ".join([s.text for s in t])[:6000]
            except Exception:
                pass

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(
            json.dumps({"transcript": transcript_text}).encode()
        )

    def log_message(self, format, *args):
        pass
