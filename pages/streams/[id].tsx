import type { NextPage } from "next";
import Layout from "@components/layout";
import Message from "@components/message";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Stream } from "@prisma/client";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import { useEffect } from "react";
import streams from "pages/api/streams";

interface StreamMessage {
	id: number;
	message: string;
	user: {
		id: number;
		avatar?: string;
	};
}
interface StreamWithMessages extends Stream {
	messages: StreamMessage[];
}
interface StreamResponse {
	ok: boolean;
	stream: StreamWithMessages;
}

interface MessageForm {
	message: string;
}
const Streaming: NextPage = () => {
	const { user } = useUser();
	const router = useRouter();
	const { register, handleSubmit, reset } = useForm<MessageForm>();
	const [sendMessage, { loading, data: sendMessageData }] = useMutation(
		`/api/streams/${router.query.id}/messages`
	);
	const { data, mutate } = useSWR<StreamResponse>(
		router?.query?.id ? `/api/streams/${router.query.id}` : null,
		{
			refreshInterval: 1000,
		}
	);
	const onValid = (form: MessageForm) => {
		if (loading) return;
		reset();
		mutate(
			(prev) =>
				prev &&
				({
					...prev,
					stream: {
						...prev.stream,
						messages: [
							...prev.stream.messages,
							{
								id: Date.now(),
								message: form.message,
								user: {
									...user,
								},
							},
						],
					},
				} as any),
			false
		);
		sendMessage(form);
	};
	return (
		<Layout canGoBack>
			<div className="py-10 px-4  space-y-4">
				<div className="w-full rounded-md shadow-sm bg-slate-300 aspect-video" />
				<div className="mt-5">
					<h1 className="text-3xl font-bold text-gray-900">
						{data?.stream?.name}
					</h1>
					<span className="text-2xl block mt-3 text-gray-900">
						${data?.stream?.price}
					</span>
					<p className=" my-6 text-gray-700">
						{data?.stream?.description}
					</p>
				</div>
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Live Chat
					</h2>
					<div className="py-10 pb-16 h-[50vh] overflow-y-scroll  px-4 space-y-4">
						<Message message="Hi how much are you selling them for?" />
						<Message message="I want ￦20,000" reversed />
						<Message message="미쳤어" />
						{data?.stream?.messages.map((message) => {
							return (
								<Message
									key={message.id}
									message={message.message}
									reversed={message.user.id === user?.id}
								/>
							);
						})}
					</div>
					<div className="fixed py-2 bg-white  bottom-0 inset-x-0">
						<form
							onSubmit={handleSubmit(onValid)}
							className="flex relative max-w-md items-center  w-full mx-auto"
						>
							<input
								{...register("message", { required: true })}
								type="text"
								className="shadow-sm rounded-full w-full border-gray-300 focus:ring-teal-500 focus:outline-none pr-12 focus:border-teal-500"
							/>
							<div className="absolute inset-y-0 flex py-1.5 pr-1.5 right-0">
								<button className="flex focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 items-center bg-teal-500 rounded-full px-3 hover:bg-teal-600 text-sm text-white">
									&rarr;
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default Streaming;
