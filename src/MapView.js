import React, { useEffect, useState } from "react";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector";
import Overlay from "ol/Overlay.js";
import Icon from "ol/style/Icon";
import Style from "ol/style/Style.js";
import pin from "./pin.png";
import "./popup.css";
import "ol/ol.css";

const popupHtml = `
  <div id="popup" class="ol-popup">
    <a href="#" id="popup-closer" class="ol-popup-closer"></a>
    <div id="popup-content"></div>
  </div>
`;

function MapView() {
  // Estado para almacenar la lista de clínicas
  const [clinicas, setClinicas] = useState([]);

  // useEffect para obtener los datos de las clínicas cuando el componente se monta
  useEffect(() => {
    const fetchClinicas = async () => {
      try {
        const response = await fetch('/api/clinicas'); // Realiza una solicitud al backend
        const data = await response.json(); // Convierte la respuesta a JSON
        setClinicas(data); // Actualiza el estado con los datos de las clínicas
      } catch (error) {
        console.error('Error fetching clinicas:', error); 
      }
    };

    fetchClinicas(); // Llama a la función para obtener los datos
  }, []); // Se ejecuta solo una vez, al montar el componente

  // useEffect para inicializar el mapa y agregar marcadores cuando se actualizan las clínicas
  useEffect(() => {
    // Agregar el popup HTML al DOM
    const rootElement = document.getElementById("root");
    rootElement.insertAdjacentHTML("beforeend", popupHtml);

    const map = new Map({
      target: "map", // ID del elemento donde se renderiza el mapa
      layers: [
        new TileLayer({
          source: new OSM(), // Capa de mapa base de OpenStreetMap
        }),
      ],
      view: new View({
        center: [-97.106, 18.8498], // Coordenadas del centro del mapa (Longitud, Latitud)
        projection: "EPSG:4326", // Sistema de referencia de coordenadas
        zoom: 14, // Nivel de zoom inicial
      }),
    });

    // Crear una lista de marcadores con geometría tipo punto
    const markers = clinicas.map((location) => {
      // Crea un Feature para cada clínica
      return new Feature({
        geometry: new Point([location.longitud, location.latitud]), // Coordenadas de la clínica
        name: location.nombre, // Nombre de la clínica
        address: location.direccion, // Dirección de la clínica
      });
    });

    // Crear una fuente vectorial con los marcadores
    const vectorialSource = new VectorSource({
      features: markers, // Lista de Features (marcadores)
    });

    // Crear una capa vectorial con la fuente vectorial
    const vectorialLayer = new VectorLayer({
      source: vectorialSource,
      style: new Style({
        image: new Icon({
          anchor: [0.5, 1], // Ancla del icono del marcador
          src: pin, // Ruta del icono del marcador
          scale: 0.04, // Escala del icono
        }),
      }),
    });

    // Agregar la capa vectorial al mapa
    map.addLayer(vectorialLayer);

    // Creación del popup
    const container = document.getElementById("popup"), // Elemento del popup
      content_element = document.getElementById("popup-content"), // Elemento del contenido del popup
      closer = document.getElementById("popup-closer"); // Elemento para cerrar el popup

    // Evento para cerrar el popup
    closer.onclick = function () {
      overlay.setPosition(undefined); // Desactiva la posición del popup
      closer.blur(); // Pierde el foco
      return false;
    };

    // Definición del popup
    const overlay = new Overlay({
      element: container, // Elemento del overlay
      autoPan: true, // Auto desplaza el mapa para ver el popup completo
    });

    // Agregar el overlay al mapa
    map.addOverlay(overlay);

    // Evento que abre el popup al hacer clic sobre el marcador
    map.on("click", function (evt) {
      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        function (feature, layer) {
          return feature; // Devuelve la Feature clicada
        }
      );
      if (feature) {
        const geometry = feature.getGeometry(); // Obtiene la geometría de la Feature
        const coord = geometry.getCoordinates(); // Obtiene las coordenadas de la geometría

        // Contenido del popup
        let content = "<h3>Clinica: " + feature.get("name") + "</h3>";
        content += "<h5> Direccion: " + feature.get("address") + "</h5>";
        content_element.innerHTML = content; // Actualiza el contenido del popup
        overlay.setPosition(coord); // Establece la posición del overlay

        console.info(feature.getProperties()); // Imprime las propiedades de la Feature en la consola
      }
    });

    return () => {
      map.setTarget(null); // Limpia el mapa cuando el componente se desmonta
    };
  }, [clinicas]); // Dependencia de useEffect, se ejecuta nuevamente cuando clinicas cambia

  return <div id="map" style={{ width: "100%", height: "400px" }} />; // Renderiza el div del mapa
}

export default MapView;
