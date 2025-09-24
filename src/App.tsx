import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { PostsList } from "./pages/PostsList";
import { PostEdit } from "./pages/PostEdit";
import { IdeasList } from "./pages/IdeasList";
import { Settings } from "./pages/Settings";
import "./App.css";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/posts" element={<PostsList />} />
          <Route path="/posts/:id" element={<PostEdit />} />
          <Route path="/ideas" element={<IdeasList />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
