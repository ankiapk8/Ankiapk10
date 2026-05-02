import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicManager } from "@/components/study-planner/topic-manager";

interface PathConfig {
  storageKey: string;
  subjectLabel: string;
  parentLabel: string;
  accentClass: string;
  backPath: string;
}

const PATH_MAP: Record<string, PathConfig> = {
  "/sub-medicine/dermatology":  { storageKey: "dermatology",   subjectLabel: "Dermatology",   parentLabel: "Sub Medicine", accentClass: "text-blue-600",   backPath: "/sub-medicine" },
  "/sub-medicine/family":       { storageKey: "family",        subjectLabel: "Family Medicine",parentLabel: "Sub Medicine", accentClass: "text-blue-600",   backPath: "/sub-medicine" },
  "/sub-medicine/emergency":    { storageKey: "emergency",     subjectLabel: "Emergency",     parentLabel: "Sub Medicine", accentClass: "text-blue-600",   backPath: "/sub-medicine" },
  "/sub-medicine/forensic":     { storageKey: "forensic",      subjectLabel: "Forensic",      parentLabel: "Sub Medicine", accentClass: "text-blue-600",   backPath: "/sub-medicine" },
  "/sub-medicine/radiology":    { storageKey: "radiology",     subjectLabel: "Radiology",     parentLabel: "Sub Medicine", accentClass: "text-blue-600",   backPath: "/sub-medicine" },
  "/psychiatric":               { storageKey: "psychiatric",   subjectLabel: "Psychiatric",   parentLabel: "Psychiatric",  accentClass: "text-purple-600", backPath: "/" },
  "/sub-surgery/ent":           { storageKey: "ent",           subjectLabel: "ENT",           parentLabel: "Sub Surgery",  accentClass: "text-orange-600", backPath: "/sub-surgery" },
  "/sub-surgery/ophthalmology": { storageKey: "ophthalmology", subjectLabel: "Ophthalmology", parentLabel: "Sub Surgery",  accentClass: "text-orange-600", backPath: "/sub-surgery" },
  "/sub-surgery/orthopedic":    { storageKey: "orthopedic",    subjectLabel: "Orthopedic",    parentLabel: "Sub Surgery",  accentClass: "text-orange-600", backPath: "/sub-surgery" },
  "/sub-surgery/neurosurgery":  { storageKey: "neurosurgery",  subjectLabel: "Neurosurgery",  parentLabel: "Sub Surgery",  accentClass: "text-orange-600", backPath: "/sub-surgery" },
  "/sub-surgery/urology":       { storageKey: "urology",       subjectLabel: "Urology",       parentLabel: "Sub Surgery",  accentClass: "text-orange-600", backPath: "/sub-surgery" },
  "/pediatric":                 { storageKey: "pediatric",     subjectLabel: "Pediatric",     parentLabel: "Pediatric",    accentClass: "text-green-600",  backPath: "/" },
  "/gynecology/gynecology":     { storageKey: "gynecology",    subjectLabel: "Gynecology",    parentLabel: "Gynecology",   accentClass: "text-pink-600",   backPath: "/gynecology" },
  "/gynecology/obstetric":      { storageKey: "obstetric",     subjectLabel: "Obstetric",     parentLabel: "Gynecology",   accentClass: "text-pink-600",   backPath: "/gynecology" },
};

interface Props { path: string; }

export default function TopicPage({ path }: Props) {
  const [, nav] = useLocation();
  const config = PATH_MAP[path];

  if (!config) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Unknown subject path: {path}</p>
        <Button variant="link" onClick={() => nav("/")}>← Back to home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav(config.backPath)} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className={`text-base font-semibold ${config.accentClass}`}>{config.subjectLabel}</h1>
          <p className="text-xs text-muted-foreground">{config.parentLabel}</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <TopicManager
          storageKey={config.storageKey}
          subjectLabel={config.subjectLabel}
          parentLabel={config.parentLabel}
          accentClass={config.accentClass}
        />
      </div>
    </div>
  );
}
