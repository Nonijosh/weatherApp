package main

import (
	"embed"
	"io"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

//go:embed static/*
var staticFiles embed.FS

func main() {
	_ = godotenv.Load()

	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticFS))))
	http.HandleFunc("/api/weather", weatherHandler)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data, err := staticFiles.ReadFile("static/index.html")
		if err != nil {
			http.Error(w, "index file not found", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(data)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("Starting server on :%s", port)
	log.Fatal(http.ListenAndServe(addr, nil))
}

func weatherHandler(w http.ResponseWriter, r *http.Request) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" {
		http.Error(w, "query parameter q is required", http.StatusBadRequest)
		return
	}

	apiBaseURL := os.Getenv("WEATHER_API_BASE_URL")
	if apiBaseURL == "" {
		apiBaseURL = "https://api.weatherapi.com/v1/forecast.json"
	}

	apiKey := os.Getenv("WEATHER_API_KEY")
	if apiKey == "" {
		http.Error(w, "WEATHER_API_KEY not set", http.StatusInternalServerError)
		return
	}

	apiKeyName := os.Getenv("WEATHER_API_KEY_NAME")
	if apiKeyName == "" {
		apiKeyName = "key"
	}

	reqURL, err := url.Parse(apiBaseURL)
	if err != nil {
		http.Error(w, "invalid WEATHER_API_BASE_URL", http.StatusInternalServerError)
		return
	}

	locationKey := os.Getenv("WEATHER_API_LOCATION_KEY")
	if locationKey == "" {
		locationKey = "q"
	}

	params := reqURL.Query()
	params.Set(apiKeyName, apiKey)
	params.Set(locationKey, query)
	params.Set("days", "3")
	params.Set("aqi", "no")
	params.Set("alerts", "no")
	reqURL.RawQuery = params.Encode()

	resp, err := http.Get(reqURL.String())
	if err != nil {
		http.Error(w, "failed to proxy Weather Channel API request", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}
