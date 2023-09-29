import React, { useEffect, useState } from "react";
import { Input, Button, List, Image, Typography, Skeleton, Modal } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { Imagine, Custom } from "../request";
import { MJMessage } from "midjourney";
import { Message } from "../interfaces/message";
import ImageCropperModal from "../components/ImageCropperModal";

const { TextArea } = Input;
const { Text } = Typography;

const Midjourney: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [inputDisable, setInputDisable] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customModalValue, setCustomModalValue] = useState("");
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [regionModalUrl, setRegionModalUrl] = useState("");
  const [customModalContent, setCustomModalContent] = useState({
    content: "",
    msgID: "",
    flags: "",
    custom: "",
    label: "",
    prompt: "",
  });

  useEffect(() => {
    const localMessages = localStorage.getItem("messages");
    if (localMessages) {
      setMessages(JSON.parse(localMessages));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("messages", JSON.stringify(messages));
    }
  }, [messages]);

  const handleMessageSend = async () => {
    let newMessage: Message = {
      text: inputValue.trim(),
      prompt: inputValue.trim(),
      progress: "waiting start",
      img: "",
    };

    if (newMessage.text) {
      const oldMessages = messages;
      setInputDisable(true);
      setMessages([...oldMessages, newMessage]);
      await Imagine(
        JSON.stringify({ prompt: newMessage.text }),
        (data: MJMessage) => {
          console.log(data);
          newMessage.img = data.uri;
          newMessage.msgHash = data.hash;
          newMessage.msgID = data.id;
          newMessage.progress = data.progress;
          newMessage.content = data.content;
          newMessage.flags = data.flags;
          newMessage.options = data.options;
          setMessages([...oldMessages, newMessage]);
        }
      );
      setInputValue("");
      setInputDisable(false);
    }
  };

  const clickLabel = async (
    content: string,
    msgId: string,
    flags: string,
    customId: string,
    label: string,
    prompt?: string
  ) => {
    let newMessage: Message = {
      text: `${content} ${label}`,
      prompt,
      progress: "waiting start",
      img: "",
    };

    const oldMessages = messages;
    setInputDisable(true);
    setMessages([...oldMessages, newMessage]);
    await Custom(
      JSON.stringify({ content, msgId, flags, customId, label, prompt }),
      (data: MJMessage) => {
        newMessage.img = data.uri;
        newMessage.msgHash = data.hash;
        newMessage.msgID = data.id;
        newMessage.content = data.content;
        newMessage.progress = data.progress;
        newMessage.flags = data.flags;
        newMessage.options = data.options;
        setMessages([...oldMessages, newMessage]);
      }
    );
    setInputDisable(false);
  };
  const renderMessage = ({
    text,
    img,
    flags,
    msgID,
    progress,
    content,
    options,
    prompt,
  }: Message) => {
    if (process.env.NEXT_PUBLIC_IMAGE_PREFIX) {
      img = img.replace(
        "https://cdn.discordapp.com/",
        process.env.NEXT_PUBLIC_IMAGE_PREFIX
      );
    }
    return (
      <List.Item
        className="flex flex-col space-y-4 justify-start items-start"
        style={{
          alignItems: "flex-start",
        }}
      >
        <Text>
          {text} {`(${progress})`}
        </Text>

        {img ? (
          <Image className="ml-2 rounded-xl" width={400} src={img} alt="" />
        ) : (
          <Skeleton.Image active />
        )}

        <div className="flex flex-wrap">
          {options &&
            options.map((option: { label: string; custom: string }) => (
              <Button
                key={option.label}
                className="m-2"
                type="primary"
                onClick={() => {
                  if (option.label === "Custom Zoom") {
                    let newPrompt = prompt || "";
                    if (!prompt?.includes("--ar")) {
                      newPrompt = `${newPrompt} --ar 1:1`;
                    }
                    if (!prompt?.includes("--zoom")) {
                      newPrompt = `${newPrompt} --zoom 2`;
                    }
                    setCustomModalValue(newPrompt);
                    setCustomModalContent({
                      content: String(content),
                      msgID: String(msgID),
                      flags: String(flags),
                      custom: option.custom,
                      label: option.label,
                      prompt: newPrompt,
                    });
                    setIsCustomModalOpen(true);
                  } else if (option.label === "Vary (Region)") {
                    setCustomModalContent({
                      content: String(content),
                      msgID: String(msgID),
                      flags: String(flags),
                      custom: option.custom,
                      label: option.label,
                      prompt: prompt || "",
                    });
                    setRegionModalUrl(img);
                    setIsRegionModalOpen(true);
                  } else {
                    clickLabel(
                      String(content),
                      String(msgID),
                      String(flags),
                      option.custom,
                      option.label,
                      prompt
                    );
                  }
                }}
              >
                {option.label}
              </Button>
            ))}
        </div>
      </List.Item>
    );
  };

  return (
    <>
      <div className="w-full mx-auto h-full flex flex-col border border-solid border-zinc-200 border-opacity-20 rounded-lg">
        <List
          style={{ height: "80vh" }}
          className="overflow-y-auto w-full px-4"
          dataSource={messages}
          renderItem={renderMessage}
        />
        <div className="flex-1 flex flex-col justify-center px-4 border-zinc-200 border-opacity-20 border-0 border-t border-solid">
          <div className="flex justify-between bg-white rounded-lg w-full">
            <TextArea
              disabled={inputDisable}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  setInputValue(`${inputValue}\n`);
                  e.preventDefault();
                } else if (e.key === "Enter") {
                  handleMessageSend();
                  e.preventDefault();
                }
              }}
              placeholder="Start typing your main idea..."
              autoSize={{ minRows: 2, maxRows: 2 }}
              style={{ paddingRight: 30, border: "none" }}
            />
            <Button
              type="primary"
              onClick={handleMessageSend}
              loading={inputDisable}
              icon={<SendOutlined />}
              title="Send"
              className="h-full"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
      <Modal
        centered
        title="Custom Zoom Out"
        open={isCustomModalOpen}
        onOk={() => {
          clickLabel(
            customModalContent.content,
            customModalContent.msgID,
            customModalContent.flags,
            customModalContent.custom,
            customModalContent.label,
            customModalValue
          );
          setIsCustomModalOpen(false);
        }}
        okText="Submit"
        onCancel={() => setIsCustomModalOpen(false)}
      >
        <Text>ZOOM OUT WITH CUSTOM --AR AND --ZOOM</Text>
        <Input
          value={customModalValue}
          onChange={(e) => setCustomModalValue(e.target.value)}
        />
      </Modal>
      <ImageCropperModal
        open={isRegionModalOpen}
        onCancel={() => setIsRegionModalOpen(false)}
        imageUrl={regionModalUrl}
        submit={async (base64ImageData) => {
          console.log(base64ImageData);
          setIsRegionModalOpen(false);
        }}
      />
    </>
  );
};

export default Midjourney;
