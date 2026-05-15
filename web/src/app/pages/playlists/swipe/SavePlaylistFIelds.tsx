import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import TextArea from "@/components/ui/TextArea";

type SavePlaylistFieldsProps = {
  name: string;
  description: string;
  errors: Record<string, string>;
  onChange: (patch: { name?: string; description?: string }) => void;
};

const SavePlaylistFields = ({ name, description, errors, onChange }: SavePlaylistFieldsProps) => (
  <div className="flex flex-col gap-3">
    <Field label="Playlist name" error={errors["savePlaylist.name"]} required>
      {(id) => (
        <Input
          id={id}
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="My removed tracks"
          maxLength={100}
          required
        />
      )}
    </Field>
    <Field label="Playlist description" error={errors["savePlaylist.description"]}>
      {(id) => (
        <TextArea
          id={id}
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What this playlist contains... :p"
          rows={3}
          maxLength={300}
        />
      )}
    </Field>
  </div>
);

export default SavePlaylistFields;
