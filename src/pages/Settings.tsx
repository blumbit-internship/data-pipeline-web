import ConfigurationSettings from "@/components/ConfigurationSetting";
import { DashboardLayout } from "@/components/DashboardLayout";
import DataValidation from "@/components/DataValidation";
import EmailScrapper from "@/components/EmailScrapper";
import PhoneScrapper from "@/components/PhoneScrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  return (
    <DashboardLayout>
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="data">Data Validation</TabsTrigger>
          <TabsTrigger value="phone">Phone Scraper</TabsTrigger>
          <TabsTrigger value="email">Email Scraper</TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <ConfigurationSettings />
        </TabsContent>
        <TabsContent value="data">
          <DataValidation />
        </TabsContent>
        <TabsContent value="phone">
          <PhoneScrapper />
        </TabsContent>
        <TabsContent value="email">
          <EmailScrapper />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
