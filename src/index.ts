
export interface Env {
	AI: Ai;
}

export default {
	async fetch(request, env): Promise<Response> {
		const response = await env.AI.run("@cf/cloudflare/clef", {
			model: "clef",
			state: "Checkout has been failing for every customer for the last hour.",
			questions: {
				urgent: {
					type: "noul",
					instructions: "Is this support request urgent?",
				},
				team: {
					type: "choice",
					instructions: "Which team should handle this request?",
					criteria: {
						billing: "Payments, invoices, and refunds",
						technical: "Outages, errors, and configuration",
						sales: "Plans and upgrades",
					},
				},
				severity: {
					type: "score",
					instructions: "How severe is the customer impact?",
					criteria: ["No impact", "Minor", "Major", "Critical"],
				},
			},
		});

		// response.answers.urgent   -> probability the request is urgent
		// response.answers.team     -> chosen team with per-option probabilities
		// response.answers.severity -> probability-weighted score (0 = lowest level)
		return Response.json(response);
	},
} satisfies ExportedHandler<Env>;