import "./styling/App.css";
import React, { useEffect, useRef, useState, useMemo } from "react";
import PopupManager from "./PopupManager";
import EditorClickHandler from "./EditorClickHandler";
import EditorInitializer from "./EditorInitializer";



function RightComponent() {
  // Konstanten ------------------------------------------------------------------------------------------------------------------

  // Referenz auf den Container des Editors, um darauf DOM-Operationen auszuführen.
  const editorContainerRef = useRef(null);

  // State für den Editor-Instanz. 'setEditor' wird verwendet, um den Editor-Status zu aktualisieren.
  const [editor, setEditor] = useState(null);

  // State für eine Menge von Zeilennummern, die hervorgehoben werden sollen. 
  //const [highlightedLines] = useState(new Set());

  // State für den Inhalt der Java-Datei, der im Editor angezeigt wird.
  const [javaFileContent, setJavaFileContent] = useState("");

  // State für die Nachricht, die im Popup angezeigt wird. 'setPopupMessage' aktualisiert diese Nachricht.
  const [popupMessage, setPopupMessage] = useState("");

  // Referenz auf das Dialog-Element (Popup), um darauf DOM-Operationen auszuführen.
  const dialogRef = useRef(null);

  // State für den Abstand des Popups zur Mausposition.
  //const [popupDistance] = useState(0);

  // State für den Textinhalt des Kommentarbereichs auf der rechten Seite.
  //const [text, setText] = useState('');

  // Erzeugt eine Instanz von PopupManager und nutzt 'useMemo' für Performance-Optimierung. 
  // Die Instanz wird nur neu erstellt, wenn sich 'dialogRef', 'setPopupMessage', oder 'popupDistance' ändert.
  const popupManager = useMemo(
    () => new PopupManager(dialogRef, setPopupMessage, 10),
    [dialogRef, setPopupMessage]
  );

  // Asynchrone Funktion zum Laden des Inhalts der Java-Testdatei.
  const loadJavaFile = async () => {
    try {
      const response = await fetch("./MethodCallTesting.java");
      const text = await response.text();
      setJavaFileContent(text);
    } catch (error) {
      console.error("Fehler beim Laden der Java-Datei:", error);
    }
  };

  // Funktion zum Schließen des Popups und Löschen der Popup-Nachricht.
  const closePopup = () => {
    popupManager.closePopup();
  };




  // -------------------------------------------------------------------------------------------------------------------------
  //UseEffekte

  //Dieser Effekt wird ausgeführt, wenn sich dialogRef, setPopupMessage oder popupDistance ändern.

  // Das wird das erstes aufgerufen, wenn eine JavaDatei geladen wird
  useEffect(() => {
    loadJavaFile();
  }, []);

  // Das als 2. um die Datei dem Konstruktur des Editors zu übergeben
  // Effekt, der ausgeführt wird, wenn der Inhalt der Java-Datei oder die hervorgehobenen Linien geändert werden
  useEffect(() => {
    if (javaFileContent && editorContainerRef.current) {
      const newEditor = EditorInitializer.initializeEditor(
        editorContainerRef,
        javaFileContent,
        
        setEditor
      );
      if (newEditor) {
        setEditor(newEditor);
        // Initialisiere den EditorClickHandler hier, nachdem der Editor erstellt wurde
        const clickHandler = new EditorClickHandler(newEditor, popupManager);
        clickHandler.handleMouseDown();
      }
    }
  }, [javaFileContent, popupManager]);

  // Effekt, der ausgeführt wird, wenn der Editor geändert wird
  useEffect(() => {
    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, [editor]);


  //-------------------------------------------------------------------------------------------------------------------


  // Render-Funktion
  return (
    <main className="right-container">
      <div ref={editorContainerRef} className="editor-container"></div>
      <div
        className="popup"
        ref={dialogRef}
        style={{ display: 'none' }} // Standardmäßig versteckt
      >
        {popupMessage}
        <br />
        <button onClick={closePopup} className="popup-close-button">
          Schließen
        </button>
      </div>
    </main>
  );

}

export default RightComponent;


/*useEffect(() => {
  // Das wird im Moment nicht ausgeführt
  if (dialogRef.current) {
    // Erstelle hier eine neue Instanz von PopupManager, wenn dialogRef verfügbar ist
    const popupManagerInstance = new PopupManager(dialogRef, setPopupMessage, popupDistance);
    // Führen Sie hier alle weiteren Aktionen mit popupManagerInstance aus
  }
}, [dialogRef, setPopupMessage, popupDistance]); */

