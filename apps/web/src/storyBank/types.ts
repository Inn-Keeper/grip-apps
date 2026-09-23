export type Story = {
  id?: string;
  title: string;
  competency: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  scenarioId?: string | null;
};

export type StoryForm = Omit<Story, "id"> & { id?: string };

export const EMPTY_FORM: StoryForm = {
  title: "",
  competency: "Conflict",
  situation: "",
  task: "",
  action: "",
  result: "",
};
