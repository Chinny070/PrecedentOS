import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Workspace } from './Workspace';
import {
  ComparePage, EvaluationDetailPage, GraphPage, LabPage, PrecedentDetailPage, TribunalPage,
  PrecedentsPage, RegisterPage, SettingsPage, SimulatePage, VerifyPage, WebEvidencePage,
} from '../pages/Pages';
import { CaseCourtPage } from '../pages/CaseCourtPage';

export function RoutedWorkspace() {
  const location = useLocation();
  return <Workspace><Routes location={location}>
    <Route path="/lab" element={<LabPage/>}/>
    <Route path="/precedents" element={<PrecedentsPage/>}/>
    <Route path="/precedents/new" element={<RegisterPage/>}/>
    <Route path="/precedents/:id" element={<PrecedentDetailPage/>}/>
    <Route path="/compare" element={<ComparePage/>}/>
    <Route path="/evaluations/:id" element={<EvaluationDetailPage/>}/>
    <Route path="/graph" element={<GraphPage/>}/>
    <Route path="/case-court" element={<CaseCourtPage/>}/>
    <Route path="/tribunal" element={<TribunalPage/>}/>
    <Route path="/simulate" element={<SimulatePage/>}/>
    <Route path="/verify" element={<VerifyPage/>}/>
    <Route path="/web-evidence" element={<WebEvidencePage/>}/>
    <Route path="/settings" element={<SettingsPage/>}/>
    <Route path="*" element={<Navigate to="/lab" replace/>}/>
  </Routes></Workspace>;
}
