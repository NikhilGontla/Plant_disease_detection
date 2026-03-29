import React from "react";
import { Amplify } from "aws-amplify";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { withAuthenticator } from "@aws-amplify/ui-react";
import awsconfig from "./aws-exports";
import WelcomePage from "./pages/WelcomePage";
import PredictionPage from "./pages/PredictionPage";
import AnnotationPage from "./pages/AnnotationPage";

Amplify.configure(awsconfig);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to="/welcome" />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/prediction" element={<PredictionPage />} />
        <Route path="/annotation" element={<AnnotationPage />} />
        <Route path="*" element={<Navigate replace to="/welcome" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default withAuthenticator(App);
