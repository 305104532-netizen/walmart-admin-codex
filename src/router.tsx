import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Placeholder from './pages/Placeholder'
import Dashboard from './pages/Dashboard'

// 入驻管理
import RegisterList from './pages/register/RegisterList'
import RegisterTrace from './pages/register/RegisterTrace'
import FormConfig from './pages/register/FormConfig'
import Prescreen from './pages/register/Prescreen'
import RegisterRemind from './pages/register/RegisterRemind'
import RegisterTask from './pages/register/RegisterTask'
// 成长中心
import GrowthScore from './pages/growth/GrowthScore'
import GrowthPersona from './pages/growth/GrowthPersona'
import GrowthTags from './pages/growth/GrowthTags'
import GrowthAudience from './pages/growth/GrowthAudience'
import GrowthDistribute from './pages/growth/GrowthDistribute'
import GrowthDayone from './pages/growth/GrowthDayone'
import GrowthEffect from './pages/growth/GrowthEffect'
// 内容管理
import ContentArticles from './pages/content/ContentArticles'
import ContentVideos from './pages/content/ContentVideos'
import ContentCategories from './pages/content/ContentCategories'
import ContentTags from './pages/content/ContentTags'
import ContentDictionary from './pages/content/ContentDictionary'
import ContentImport from './pages/content/ContentImport'
import SearchConfig from './pages/content/SearchConfig'
// 活动管理
import ActivityList from './pages/activity/ActivityList'
import ActivityDetail from './pages/activity/ActivityDetail'
import ActivityCreate from './pages/activity/ActivityCreate'
import ActivitySignup from './pages/activity/ActivitySignup'
import ActivityCheckin from './pages/activity/ActivityCheckin'
import ActivityLeads from './pages/activity/ActivityLeads'
import ActivitySurvey from './pages/activity/ActivitySurvey'
import ActivityScm from './pages/activity/ActivityScm'
import SummitList from './pages/activity/SummitList'
import SummitCreate from './pages/activity/SummitCreate'
// 数据看板
import DataOverview from './pages/data/DataOverview'
import DataBehavior from './pages/data/DataBehavior'
import DataLearning from './pages/data/DataLearning'
// 消息管理
import MsgTemplate from './pages/message/MsgTemplate'
import MsgInbox from './pages/message/MsgInbox'
import MsgSubscribe from './pages/message/MsgSubscribe'
// 资源位
import ResBanner from './pages/resource/ResBanner'
import ResPopup from './pages/resource/ResPopup'
import ResEditor from './pages/resource/ResEditor'
import ResPages from './pages/resource/ResPages'
// 系统设置
import SetOrganization from './pages/settings/SetOrganization'
import SetPermission from './pages/settings/SetPermission'
import SetTracking from './pages/settings/SetTracking'
import SetApi from './pages/settings/SetApi'
import SetCommission from './pages/settings/SetCommission'
import SetLogs from './pages/settings/SetLogs'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },

      { path: 'register/list', element: <RegisterList /> },
      { path: 'register/trace', element: <RegisterTrace /> },
      { path: 'register/detail/:id', element: <Placeholder title="入驻申请详情" /> },
      { path: 'register/form-config', element: <FormConfig /> },
      { path: 'register/prescreen', element: <Prescreen /> },
      { path: 'register/remind', element: <RegisterRemind /> },
      { path: 'register/task', element: <RegisterTask /> },

      { path: 'growth/score', element: <GrowthScore /> },
      { path: 'growth/persona', element: <GrowthPersona /> },
      { path: 'growth/tags', element: <GrowthTags /> },
      { path: 'growth/audience', element: <GrowthAudience /> },
      { path: 'growth/distribute', element: <GrowthDistribute /> },
      { path: 'growth/dayone', element: <GrowthDayone /> },
      { path: 'growth/effect', element: <GrowthEffect /> },

      { path: 'content/articles', element: <ContentArticles /> },
      { path: 'content/videos', element: <ContentVideos /> },
      { path: 'content/categories', element: <ContentCategories /> },
      { path: 'content/tags', element: <ContentTags /> },
      { path: 'content/dictionary', element: <ContentDictionary /> },
      { path: 'content/import', element: <ContentImport /> },
      { path: 'content/search-config', element: <SearchConfig /> },

      { path: 'activity/list', element: <ActivityList /> },
      { path: 'activity/detail/:id', element: <ActivityDetail /> },
      { path: 'activity/create', element: <ActivityCreate /> },
      { path: 'activity/summit', element: <SummitList /> },
      { path: 'activity/summit/create', element: <SummitCreate /> },
      { path: 'activity/signup', element: <ActivitySignup /> },
      { path: 'activity/signup/:id', element: <ActivitySignup /> },
      { path: 'activity/checkin', element: <ActivityCheckin /> },
      { path: 'activity/checkin/:id', element: <ActivityCheckin /> },
      { path: 'activity/leads', element: <ActivityLeads /> },
      { path: 'activity/survey', element: <ActivitySurvey /> },
      { path: 'activity/scm', element: <ActivityScm /> },

      { path: 'data/overview', element: <DataOverview /> },
      { path: 'data/behavior', element: <DataBehavior /> },
      { path: 'data/learning', element: <DataLearning /> },

      { path: 'message/template', element: <MsgTemplate /> },
      { path: 'message/inbox', element: <MsgInbox /> },
      { path: 'message/subscribe', element: <MsgSubscribe /> },

      { path: 'resource/banner', element: <ResBanner /> },
      { path: 'resource/popup', element: <ResPopup /> },
      { path: 'resource/editor', element: <ResEditor /> },
      { path: 'resource/pages', element: <ResPages /> },

      { path: 'settings/organization', element: <SetOrganization /> },
      { path: 'settings/permission', element: <SetPermission /> },
      { path: 'settings/tracking', element: <SetTracking /> },
      { path: 'settings/api', element: <SetApi /> },
      { path: 'settings/commission', element: <SetCommission /> },
      { path: 'settings/logs', element: <SetLogs /> },
    ],
  },
], { basename: import.meta.env.BASE_URL })
