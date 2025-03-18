import React, { useState } from "react";
import Modal from "react-modal";
import ReadmeModal from "./ReadmeModal";
import "../Css/App.css";

// Sets the app element for accessibility reasons
Modal.setAppElement("#root");

export default function HelpButton() {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  return (
    <>
      <button className="nav--help-button" onClick={openModal}>
        Help
      </button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Readme Modal"
        overlayClassName="modal-overlay"   // Applies the full-screen gradient overlay
        className="modal-content"          // Applies the modal box styling
      >
        <ReadmeModal closeModal={closeModal} />
      </Modal>
    </>
  );
}
