import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Topics from "./pages/Topics";
import Scheduler from "./pages/Scheduler";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/scheduler" element={<Scheduler />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
