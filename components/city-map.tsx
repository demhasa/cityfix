"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibre, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type MapIncident = { id: string; title: string; priority: string; lat: number; lng: number; status: string };

export default function CityMap({ incidents, className = "" }: { incidents: MapIncident[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MapLibre({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [21.1655, 42.6629],
      zoom: 12.5,
    });
    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = incidents.filter((incident) => Number.isFinite(incident.lat) && Number.isFinite(incident.lng)).map((incident) => {
      const color = incident.priority === "urgent" ? "#dd5b52" : incident.priority === "high" ? "#e78b39" : "#237c59";
      const marker = new Marker({ color })
        .setLngLat([incident.lng, incident.lat])
        .setPopup(new Popup({ offset: 24 }).setHTML(`<strong>${escapeHtml(incident.title)}</strong><br><small>${escapeHtml(incident.status)}</small>`))
        .addTo(map);
      return marker;
    });
  }, [incidents]);

  return <div ref={containerRef} className={`city-map ${className}`} aria-label="Harta e Prishtinës me problemet e raportuara" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}
